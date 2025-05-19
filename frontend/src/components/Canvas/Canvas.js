import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { detectRooms } from '../../utils/roomDetection';
import { useHeatmap } from '../../hooks/useHeatmap';
import { getWorldCoordinates } from '../../utils/getWorldCoordinates';
import { testSignalAtPoint } from '../../utils/testSignalAtPoint';
import { useCanvasInteractions } from '../../hooks/useCanvasInteractions';
import {
	addNodeLogic,
	deleteNodeLogic,
	addAPLogic,
	deleteAPLogic,
} from '../../utils/canvasActions';
import {
	NODE_COLOR,
	AP_COLOR,
	TEXT_COLOR,
	ALLOWED_ANGLES,
	AP_DISTANCE_THRESHOLD,
	BASE_GRID_SIZE,
	MAX_HISTORY_LENGTH,
	NODE_DISTANCE_THRESHOLD,
	SELECTED_COLOR,
	WALL_MATCH_THRESHOLD,
	ZOOM_MAX,
	ZOOM_MIN,
	DEFAULT_WALL_CONFIG,
	DEFAULT_AP_CONFIG,
	DEFAULT_RF_CONFIG,
	MATERIALS,
} from '../../constants/config';
import {
	distanceToSegment,
	getOrCreateNode,
	getSnappedCursorPos,
	snapToGrid,
	trySplitWallAtClick,
	trySplitWallWithLine,
	getNodeAtPoint,
	getWallAtPoint,
	getAPAtPoint,
} from '../../utils/gridUtils';
import '../../pages/Workspace/Workspace.css';
import { useToast } from '../Toast/ToastContext';
import { createGrid } from '../../utils/createGrid';
import { drawPreview } from '../../utils/drawPreview';
import {
	handleSaveStateToHistory,
	handleUndo,
	handleRedo,
} from '../../utils/historyUtils';
import { centerGrid } from '../../utils/gridUtils';

const Canvas = ({
	mode,
	nodes,
	setNodes,
	walls,
	setWalls,
	lastAddedNode,
	setLastAddedNode,
	openConfigSidebar,
	accessPoints,
	setAccessPoints,
	setSelected,
	selected,
}) => {
	const canvasRef = useRef(null);
	const [zoom, setZoom] = useState(25);
	const [offset, setOffset] = useState({ x: 0, y: 0 });
	const [showGrid, setShowGrid] = useState(true);
	const [showRooms, setShowRooms] = useState(true);
	const [showCoverage, setShowCoverage] = useState(true);
	const [showUnits, setShowUnits] = useState(true);
	const [showStrength, setShowStrength] = useState(false);
	const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
	const [preview, setPreview] = useState(null);
	const [isLoaded, setIsLoaded] = useState(false);
	const [isValidPreview, setIsValidPreview] = useState(true);
	const roomColorsRef = useRef({});
	const [history, setHistory] = useState([]);
	const [redoStack, setRedoStack] = useState([]);
	const [roomShapes, setRoomShapes] = useState([]);
	const [heatmapTiles, setHeatmapTiles] = useState([]);
	const [rawCursorPos, setRawCursorPos] = useState(null);

	const { showToast } = useToast();
	const gridSizes = {
		base: BASE_GRID_SIZE,
		main: BASE_GRID_SIZE * zoom,
		sub: (BASE_GRID_SIZE * zoom) / 5,
		subSub: (BASE_GRID_SIZE * zoom) / 10,
	};

	useEffect(() => {
		if (!isLoaded) {
			setIsLoaded(true);
			centerGrid(setOffset);
		}
	}, [isLoaded]);

	/**
	 * Handles zoom events on the canvas by adjusting the zoom state.
	 * @param {WheelEvent} event - The wheel event object.
	 */
	const handleZoom = (event) => {
		event.preventDefault(); // Prevent the default scroll behavior
		const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
		setZoom(Math.max(ZOOM_MIN, Math.min(zoom * zoomFactor, ZOOM_MAX)));
	};

	useEffect(() => {
		if (!mode.isAddingNode) {
			setLastAddedNode(null);
		}
	}, [mode.isAddingNode]);

	// Manually attach the event listener with passive: false
	useEffect(() => {
		const canvasContainer = document.querySelector('.canvas-container');
		if (canvasContainer) {
			canvasContainer.addEventListener('wheel', handleZoom, { passive: false });

			// Clean up the event listener when the component unmounts
			return () => {
				canvasContainer.removeEventListener('wheel', handleZoom);
			};
		}
	}, [zoom]); // Reattach listener whenever zoom state changes

	/**
	 * Calculates the area of a polygon given its vertices.
	 * @param {Array<{x: number, y: number}>} points - Array of points representing the polygon vertices.
	 * @returns {number} The area of the polygon.
	 */
	const getPolygonArea = (points) => {
		let area = 0;
		const n = points.length;
		for (let i = 0; i < n; i++) {
			const { x: x1, y: y1 } = points[i];
			const { x: x2, y: y2 } = points[(i + 1) % n];
			area += x1 * y2 - x2 * y1;
		}
		return Math.abs(area / 2);
	};

	useEffect(() => {
		const allRooms = detectRooms(walls);
		const filtered = allRooms.filter((room) => getPolygonArea(room) >= 10);
		setRoomShapes(filtered);
	}, [walls]);

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');

		canvas.width = window.innerWidth * 2;
		canvas.height = window.innerHeight * 2;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// **Set (0,0) to Grid Center**
		const centerX = canvas.width / 2 + offset.x;
		const centerY = canvas.height / 2 + offset.y;

		if (showGrid) {
			createGrid(canvas, ctx, zoom, centerX, centerY, gridSizes);
		}

		let roomColorsRef = {};
		let nextHue = 0;

		if (showRooms) {
			// Fill Rooms First
			roomShapes.forEach((nodes) => {
				ctx.beginPath();
				nodes.forEach(({ x, y }, i) => {
					const screenX = centerX + x * zoom;
					const screenY = centerY + y * zoom;
					if (i === 0) ctx.moveTo(screenX, screenY);
					else ctx.lineTo(screenX, screenY);
				});
				ctx.closePath();

				const key = nodes
					.map((n) => `${n.x},${n.y}`)
					.sort()
					.join('|');
				if (!roomColorsRef[key]) {
					const hue = (nextHue * 137.508) % 360; // golden angle for better spread
					roomColorsRef[key] = `hsla(${hue}, 80%, 60%, 0.25)`;
					nextHue++;
				}

				ctx.fillStyle = roomColorsRef[key];
				ctx.fill();
			});
		}

		// WiFi Signal Heatmap Rendering
		const gridStep = gridSizes.base / 10;
		if (showCoverage) {
			const signalToColor = (dbm) => {
				const minDbm = -90;
				const maxDbm = -35;

				let normalized = (dbm - minDbm) / (maxDbm - minDbm);
				normalized = Math.min(Math.max(normalized, 0), 1); // clamp [0,1]

				const eased = Math.pow(normalized, 2.2); // exaggerates red/yellow range
				const green = Math.floor(eased * 255);
				const red = 255 - green;

				return `rgba(${red}, ${green}, 0, 0.35)`;
			};

			heatmapTiles.forEach(({ x, y, signal }) => {
				const screenX = centerX + x * zoom;
				const screenY = centerY + y * zoom;
				const buffer = gridStep * zoom;
				if (
					screenX < -buffer ||
					screenY < -buffer ||
					screenX > canvas.width + buffer ||
					screenY > canvas.height + buffer
				)
					return;

				ctx.fillStyle = signalToColor(signal);
				ctx.fillRect(
					screenX - (gridStep * zoom) / 2,
					screenY - (gridStep * zoom) / 2,
					gridStep * zoom,
					gridStep * zoom
				);

				const labelRadius = gridStep * 4; // area in world units
				let drawLabel = showStrength;
				let opacity = 1;

				if (!showStrength && rawCursorPos) {
					const dx = rawCursorPos.x - x;
					const dy = rawCursorPos.y - y;
					const dist = Math.sqrt(dx * dx + dy * dy);

					if (dist < labelRadius) {
						drawLabel = true;

						// opacity falloff from center to edge
						const falloff = 1 - dist / labelRadius; // 1 → 0
						opacity = Math.pow(falloff, 1.5); // smoother fade
					}
				}

				if (zoom > 0.5 && mode.isTestingSignal && drawLabel) {
					ctx.globalAlpha = opacity * 0.9; // final alpha
					ctx.fillStyle = signal < -70 ? 'white' : 'black';
					ctx.font = `${Math.max(0.4 * zoom, 0.2)}px Arial`;
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillText(`${Math.round(signal)}`, screenX, screenY);
					ctx.globalAlpha = 1; // reset after drawing
				}
			});
		}

		// **Draw Walls (Lines between nodes)**
		walls.forEach((wall) => {
			const { a: startNode, b: endNode } = wall;
			const dx = endNode.x - startNode.x;
			const dy = endNode.y - startNode.y;
			const length = Math.sqrt(dx * dx + dy * dy);
			if (length === 0) {
				//console.log("⚠️ Zero-length wall detected:", startNode, endNode);
			}

			const startX = centerX + startNode.x * zoom;
			const startY = centerY + startNode.y * zoom;
			const endX = centerX + endNode.x * zoom;
			const endY = centerY + endNode.y * zoom;

			const thickness = wall.config?.thickness ?? 100;
			ctx.lineWidth = Math.max(5, thickness / 25); // 100mm → 4px, 200mm → 8px

			const material = wall.config?.material ?? 'unknown';
			const color = MATERIALS[material].color ?? MATERIALS.unknown.color;

			ctx.strokeStyle =
				selected.wall && wall.id === selected.wall.id ? SELECTED_COLOR : color;

			ctx.beginPath();
			ctx.moveTo(startX, startY);
			ctx.lineTo(endX, endY);
			ctx.stroke();

			if (showUnits) {
				const displayLength = length.toFixed(2);
				const midX = (startX + endX) / 2;
				const midY = (startY + endY) / 2;

				const angle = Math.atan2(endY - startY, endX - startX);
				const flip = Math.abs(angle) > Math.PI / 2;

				ctx.save();
				ctx.translate(midX, midY);
				ctx.rotate(angle + (flip ? Math.PI : 0));
				ctx.font = `${0.5 * zoom}px sans-serif`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'bottom';
				ctx.fillStyle = TEXT_COLOR;
				ctx.fillText(`${displayLength}m`, 0, -5);
				ctx.restore();
			}
		});

		// **Draw Nodes**
		ctx.fillStyle = NODE_COLOR;
		nodes.forEach(({ x, y }) => {
			ctx.beginPath();
			ctx.arc(centerX + x * zoom, centerY + y * zoom, 6, 0, Math.PI * 2);
			ctx.fill();
		});

		// Draw Access Points as squares
		ctx.fillStyle = AP_COLOR;
		accessPoints.forEach((ap) => {
			const maxRange = ap.config?.range ?? DEFAULT_RF_CONFIG.maxRangeMeters;

			const apScreenX = centerX + ap.x * zoom;
			const apScreenY = centerY + ap.y * zoom;
			ctx.beginPath();
			ctx.arc(apScreenX, apScreenY, maxRange * zoom, 0, Math.PI * 2);
			ctx.strokeStyle = 'rgba(29, 93, 191, 0.5)';
			ctx.lineWidth = 1;
			ctx.stroke();

			const screenX = centerX + ap.x * zoom;
			const screenY = centerY + ap.y * zoom;
			const size = 12;

			ctx.fillRect(screenX - size / 2, screenY - size / 2, size, size);

			if (ap.name) {
				ctx.font = `${0.5 * zoom}px sans-serif`;
				ctx.fillStyle = TEXT_COLOR;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'bottom';
				ctx.fillText(ap.name, screenX, screenY - size / 2 - 2);
			}
		});

		// Highlight selected AP
		if (selected.ap) {
			const screenX = centerX + selected.ap.x * zoom;
			const screenY = centerY + selected.ap.y * zoom;
			const size = 16;

			ctx.strokeStyle = SELECTED_COLOR;
			ctx.lineWidth = 3;
			ctx.strokeRect(screenX - size / 2, screenY - size / 2, size, size);
		}

		drawPreview(
			preview,
			ctx,
			zoom,
			centerX,
			centerY,
			isValidPreview,
			selected.node,
			mode.isAddingNode
		);

		// ✅ Draw Selected Node Highlight (after normal nodes)
		if (selected.node) {
			const selectedX = centerX + selected.node.x * zoom;
			const selectedY = centerY + selected.node.y * zoom;

			// Outline
			ctx.beginPath();
			ctx.arc(selectedX, selectedY, 8, 0, Math.PI * 2);
			ctx.strokeStyle = SELECTED_COLOR;
			ctx.lineWidth = 3;
			ctx.stroke();
		}
	}, [
		zoom,
		offset,
		showGrid,
		showRooms,
		showCoverage,
		showUnits,
		showStrength,
		nodes,
		preview,
		walls,
		selected,
		accessPoints,
		roomShapes,
		mode.isAddingNode,
		rawCursorPos,
	]);

	useHeatmap({
		accessPoints,
		walls,
		showCoverage,
		gridSize: gridSizes.base,
		rfConfig: DEFAULT_RF_CONFIG,
		setHeatmapTiles,
	});

	/**
	 * Determines if the angle between two points is allowed based on the configuration.
	 * @param {number} dx - Delta X.
	 * @param {number} dy - Delta Y.
	 * @returns {boolean} True if the angle is allowed, false otherwise.
	 */
	const isAllowedAngle = (dx, dy) => {
		const angle = Math.atan2(dy, dx) * (180 / Math.PI);
		const absAngle = Math.abs(angle);
		const epsilon = 0.01;

		return ALLOWED_ANGLES.some((a) => Math.abs(absAngle - a) < epsilon);
	};

	/**
	 * Clears all selected elements (nodes, walls, access points).
	 */
	const clearSelected = () => {
		setSelected({ node: null, wall: null, ap: null });
		setLastAddedNode(null);
	};

	/**
	 * Toggles the visibility of the grid.
	 */
	const toggleGrid = () => {
		setShowGrid((prev) => !prev);
	};

	/**
	 * Toggles the visibility of detected rooms.
	 */
	const toggleRooms = () => {
		setShowRooms((prev) => !prev);
	};

	/**
	 * Toggles the visibility of WiFi coverage.
	 */
	const toggleCoverage = () => {
		setShowCoverage((prev) => !prev);
	};

	/**
	 * Toggles the visibility of unit measurements.
	 */
	const toggleUnits = () => {
		setShowUnits((prev) => !prev);
	};

	const toggleStrength = () => {
		setShowStrength((prev) => !prev);
	};

	const saveStateToHistory = () => {
		handleSaveStateToHistory(
			history,
			setHistory,
			nodes,
			walls,
			accessPoints,
			setRedoStack
		);
	};

	const undo = () => {
		handleUndo(
			history,
			setHistory,
			redoStack,
			setRedoStack,
			setNodes,
			setWalls,
			setAccessPoints,
			clearSelected,
			nodes,
			walls,
			accessPoints
		);
	};

	const redo = () => {
		handleRedo(
			redoStack,
			setRedoStack,
			history,
			setHistory,
			setNodes,
			setWalls,
			setAccessPoints,
			clearSelected,
			nodes,
			walls,
			accessPoints
		);
	};

	/**
	 * Adds a node at the cursor position, splitting walls if necessary and validating angles.
	 * @param {MouseEvent} event - The mouse event object.
	 */
	const addNode = (event) => {
		saveStateToHistory();
		addNodeLogic({
			event,
			canvasRef,
			offset,
			zoom,
			nodes,
			walls,
			lastAddedNode,
			setCursorPos,
			snapToGrid,
			isAllowedAngle,
			showToast,
			setNodes,
			setWalls,
			setLastAddedNode,
			setSelected,
		});
	};

	/**
	 * Deletes a node at the cursor position and removes related walls.
	 * @param {MouseEvent} event - The mouse event object.
	 */
	const deleteNode = (event) => {
		saveStateToHistory();
		deleteNodeLogic({
			event,
			canvasRef,
			offset,
			zoom,
			snapToGrid,
			setNodes,
			setWalls,
			setCursorPos,
		});
	};

	/**
	 * Adds an access point at the cursor position.
	 * @param {MouseEvent} event - The mouse event object.
	 */
	const addAP = (event) => {
		saveStateToHistory();
		addAPLogic({
			event,
			canvasRef,
			offset,
			zoom,
			accessPoints,
			walls,
			setAccessPoints,
			showToast,
			setCursorPos,
		});
	};

	/**
	 * Deletes an access point at the cursor position.
	 * @param {MouseEvent} event - The mouse event object.
	 */
	const deleteAP = (event) => {
		saveStateToHistory();
		deleteAPLogic({
			event,
			canvasRef,
			offset,
			zoom,
			accessPoints,
			setAccessPoints,
			setCursorPos,
		});
	};

	/**
	 * Handles selection of nodes, walls, or access points based on the cursor position.
	 * @param {MouseEvent} event - The mouse event object.
	 */
	const startSelect = (event) => {
		const { x, y } = getWorldCoordinates(
			event,
			canvasRef.current,
			offset,
			zoom
		);

		const clickedNode = getNodeAtPoint(x, y, nodes);
		console.log('Clicked node:', clickedNode);

		const clickedWall = getWallAtPoint(x, y, walls);
		console.log('Clicked wall:', clickedWall);

		const clickedAP = getAPAtPoint(x, y, accessPoints);
		console.log('Clicked AP:', clickedAP);

		if (clickedNode) {
			setSelected({ node: clickedNode, wall: null, ap: null });
			openConfigSidebar();
			return;
		} else if (clickedWall) {
			setSelected({ node: null, wall: clickedWall, ap: null });
			openConfigSidebar();
			return;
		} else if (clickedAP) {
			setSelected({ node: null, wall: null, ap: clickedAP });
			openConfigSidebar();
			return;
		} else {
			clearSelected();
		}
	};

	useEffect(() => {
		const handleKeyDown = (e) => {
			const target = e.target;
			const isTyping =
				target.tagName === 'INPUT' ||
				target.tagName === 'TEXTAREA' ||
				target.isContentEditable;

			if (isTyping) return; // Don't trigger key logic while typing

			if (e.key === 'Escape') {
				e.preventDefault();
				clearSelected();
			} else if (e.ctrlKey && e.key === 'z') {
				e.preventDefault();
				undo();
			} else if (
				e.ctrlKey &&
				(e.key === 'y' || (e.shiftKey && e.key === 'Z'))
			) {
				e.preventDefault();
				redo();
			} else if (e.key === 'Backspace' || e.key === 'Delete') {
				e.preventDefault();
				saveStateToHistory();

				if (selected.node) {
					const nodeId = selected.node.id;
					setNodes((prevNodes) =>
						prevNodes.filter((node) => node.id !== nodeId)
					);
					setWalls((prevWalls) =>
						prevWalls.filter(({ a, b }) => {
							const matchesA =
								a.id === nodeId ||
								(a.x === selected.node.x && a.y === selected.node.y);
							const matchesB =
								b.id === nodeId ||
								(b.x === selected.node.x && b.y === selected.node.y);
							return !matchesA && !matchesB;
						})
					);
					setSelected({ node: null, wall: null, ap: null });
				} else if (selected.wall) {
					setWalls((prev) => prev.filter((w) => w.id !== selected.wall.id));
					setSelected({ node: null, wall: null, ap: null });
				} else if (selected.ap) {
					setAccessPoints((prevAps) =>
						prevAps.filter((ap) => ap.id !== selected.ap.id)
					);
					setSelected({ node: null, wall: null, ap: null });
				}
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [selected, nodes, walls, history, redoStack]);

	const testSignalAtCursor = (event) => {
		const { x, y } = getWorldCoordinates(
			event,
			canvasRef.current,
			offset,
			zoom
		);
		const result = testSignalAtPoint({ x, y }, accessPoints, walls);
		if (result) {
			showToast(
				`📶 Signal strength: ${Math.round(result.signal)} dBm\n` +
					`From ${result.ap.name}\n` +
					`Estimated quality: ${result.quality}`
			);
		} else {
			showToast('❌ No signal detected at this location.');
		}
	};

	const { handleMouseMove, handleMouseDown, stopPan, handleDoubleClick } =
		useCanvasInteractions({
			canvasRef,
			mode,
			zoom,
			offset,
			lastAddedNode,
			setCursorPos,
			setPreview,
			setIsValidPreview,
			clearSelected,
			setRawCursorPos,
			isAllowedAngle,
			startSelect,
			deleteAP,
			addAP,
			addNode,
			deleteNode,
			testSignalAtCursor,
			setOffset,
		});

	return (
		<div className="workspace">
			<div
				className="canvas-container"
				onMouseMove={handleMouseMove}
				onMouseDown={handleMouseDown}
				onMouseUp={stopPan}
				onMouseLeave={stopPan}
				onDoubleClick={handleDoubleClick}
			>
				<canvas
					ref={canvasRef}
					className="grid-canvas"
					onContextMenu={(e) => e.preventDefault()}
				></canvas>
			</div>

			<div className="canvas-toggle-buttons">
				<button className="canvas-overlay-button" onClick={toggleGrid}>
					{showGrid ? 'Hide Grid' : 'Show Grid'}
				</button>

				<button className="canvas-overlay-button" onClick={toggleRooms}>
					{showRooms ? 'Hide Rooms' : 'Show Rooms'}
				</button>

				<button className="canvas-overlay-button" onClick={toggleCoverage}>
					{showCoverage ? 'Hide Coverage' : 'Show Coverage'}
				</button>

				<button className="canvas-overlay-button" onClick={toggleUnits}>
					{showUnits ? 'Hide Units' : 'Show Units'}
				</button>

				<button className="canvas-overlay-button" onClick={toggleStrength}>
					{showStrength ? 'Hide Strength Numbers' : 'Show Strength Numbers'}
				</button>
			</div>

			<div className="upperBottomContainer">
				<button className="canvas-overlay-button" onClick={undo}>
					Undo
				</button>
				<button className="canvas-overlay-button" onClick={redo}>
					Redo
				</button>
			</div>

			<div className="bottomContainer">
				<div className="canvas-overlay-button">
					X: {cursorPos.x}m, Y: {cursorPos.y}m
				</div>

				<div className="canvas-overlay-button">
					{roomShapes.length === 1
						? `${roomShapes.length} Room`
						: `${roomShapes.length} Rooms`}
				</div>

				<div className="canvas-overlay-button">
					Zoom: {Math.round(zoom * 100) / 100}x
				</div>
			</div>
		</div>
	);
};

export default Canvas;
