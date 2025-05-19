import { useEffect, useMemo, useRef, useState } from 'react';
import {
	ALLOWED_ANGLES,
	BASE_GRID_SIZE,
	DEFAULT_RF_CONFIG,
} from '../../constants/config';
import { useCanvasInteractions } from '../../hooks/useCanvasInteractions';
import { useHeatmap } from '../../hooks/useHeatmap';
import { useZoom } from '../../hooks/useZoom';
import '../../pages/Workspace/Workspace.css';
import {
	addAPLogic,
	addNodeLogic,
	deleteAPLogic,
	deleteNodeLogic,
} from '../../utils/canvasActions';
import { createGrid } from '../../utils/createGrid';
import { drawAPs } from '../../utils/drawAPs';
import { drawHeatmap } from '../../utils/drawHeatmap';
import { drawNodes } from '../../utils/drawNodes';
import { drawPreview } from '../../utils/drawPreview';
import { drawRooms } from '../../utils/drawRooms';
import { drawWalls } from '../../utils/drawWalls';
import { getWorldCoordinates } from '../../utils/getWorldCoordinates';
import {
	centerGrid,
	getAPAtPoint,
	getNodeAtPoint,
	getPolygonArea,
	getWallAtPoint,
	snapToGrid,
} from '../../utils/gridUtils';
import {
	handleRedo,
	handleSaveStateToHistory,
	handleUndo,
} from '../../utils/historyUtils';
import { detectRooms } from '../../utils/roomDetection';
import { testSignalAtPoint } from '../../utils/testSignalAtPoint';
import { useToast } from '../Toast/ToastContext';

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
	const [history, setHistory] = useState([]);
	const [redoStack, setRedoStack] = useState([]);
	const [roomShapes, setRoomShapes] = useState([]);
	const [heatmapTiles, setHeatmapTiles] = useState([]);
	const [rawCursorPos, setRawCursorPos] = useState(null);

	const { showToast } = useToast();
	const gridSizes = useMemo(
		() => ({
			base: BASE_GRID_SIZE,
			main: BASE_GRID_SIZE * zoom,
			sub: (BASE_GRID_SIZE * zoom) / 5,
			subSub: (BASE_GRID_SIZE * zoom) / 10,
		}),
		[zoom]
	);

	useEffect(() => {
		if (!isLoaded) {
			setIsLoaded(true);
			centerGrid(setOffset);
		}
	}, [isLoaded]);

	useZoom(canvasRef, setZoom);

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

		if (showRooms) {
			drawRooms(ctx, roomShapes, { zoom, centerX, centerY });
		}

		// WiFi Signal Heatmap Rendering
		const gridStep = gridSizes.base / 10;
		if (showCoverage) {
			drawHeatmap({
				ctx,
				canvas,
				tiles: heatmapTiles,
				centerX,
				centerY,
				gridStep,
				zoom,
				mode,
				showStrength,
				rawCursorPos,
			});
		}

		// **Draw Walls (Lines between nodes)**
		drawWalls(ctx, walls, {
			zoom,
			centerX,
			centerY,
			showUnits,
			selected,
		});

		// **Draw Nodes**
		drawNodes(ctx, nodes, selected, {
			zoom,
			centerX,
			centerY,
			showUnits,
			selected,
		});

		// Draw Access Points as squares
		drawAPs(ctx, accessPoints, selected, { zoom, centerX, centerY });

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
		gridSizes,
		heatmapTiles,
		isValidPreview,
		mode,
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

	const toggle = (setter) => {
		setter((prev) => !prev);
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
		const clickedWall = getWallAtPoint(x, y, walls);
		const clickedAP = getAPAtPoint(x, y, accessPoints);

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
				<button
					className="canvas-overlay-button"
					onClick={() => toggle(setShowGrid)}
				>
					{showGrid ? 'Hide Grid' : 'Show Grid'}
				</button>

				<button
					className="canvas-overlay-button"
					onClick={() => toggle(setShowRooms)}
				>
					{showRooms ? 'Hide Rooms' : 'Show Rooms'}
				</button>

				<button
					className="canvas-overlay-button"
					onClick={() => toggle(setShowCoverage)}
				>
					{showCoverage ? 'Hide Coverage' : 'Show Coverage'}
				</button>

				<button
					className="canvas-overlay-button"
					onClick={() => toggle(setShowUnits)}
				>
					{showUnits ? 'Hide Units' : 'Show Units'}
				</button>

				<button
					className="canvas-overlay-button"
					onClick={() => toggle(setShowStrength)}
				>
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
