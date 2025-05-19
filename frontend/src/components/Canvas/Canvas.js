import { useEffect, useMemo, useRef, useState } from 'react';
import { BASE_GRID_SIZE, DEFAULT_RF_CONFIG } from '../../constants/config';
import { useCanvasInteractions } from '../../hooks/useCanvasInteractions';
import { useHeatmap } from '../../hooks/useHeatmap';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useSignalTester } from '../../hooks/useSignalTester';
import { useZoom } from '../../hooks/useZoom';
import '../../pages/Workspace/Workspace.css';
import {
	addAPLogic,
	addNodeLogic,
	deleteAPLogic,
	deleteNodeLogic,
} from '../../utils/canvasActions';
import { drawCanvas } from '../../utils/drawCanvas';
import { getWorldCoordinates } from '../../utils/getWorldCoordinates';
import {
	centerGrid,
	getAPAtPoint,
	getNodeAtPoint,
	getPolygonArea,
	getWallAtPoint,
	isAllowedAngle,
	snapToGrid,
} from '../../utils/gridUtils';
import {
	handleRedo,
	handleSaveStateToHistory,
	handleUndo,
} from '../../utils/historyUtils';
import { detectRooms } from '../../utils/roomDetection';
import { useToast } from '../Toast/ToastContext';
import { ToggleButton } from '../ToggleButton';

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

	/* Center grid on project first load */
	useEffect(() => {
		if (!isLoaded) {
			setIsLoaded(true);
			centerGrid(setOffset);
		}
	}, [isLoaded]);

	/* Binds zoom hook */
	useZoom(canvasRef, setZoom);

	const validRooms = useMemo(() => {
		const allRooms = detectRooms(walls);
		return allRooms.filter((room) => getPolygonArea(room) >= 10);
	}, [walls]);

	useEffect(() => {
		setRoomShapes(validRooms);
	}, [validRooms]);

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');

		drawCanvas({
			canvas,
			ctx,
			state: { offset, zoom, gridSizes },
			deps: {
				showGrid,
				showRooms,
				showCoverage,
				showUnits,
				showStrength,
				nodes,
				walls,
				accessPoints,
				selected,
				roomShapes,
				heatmapTiles,
				rawCursorPos,
				preview,
				isValidPreview,
				mode,
			},
		});
	}, [
		offset,
		zoom,
		gridSizes,
		showGrid,
		showRooms,
		showCoverage,
		showUnits,
		showStrength,
		nodes,
		walls,
		accessPoints,
		selected,
		roomShapes,
		heatmapTiles,
		rawCursorPos,
		preview,
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

	const testSignalAtCursor = useSignalTester({
		accessPoints,
		walls,
		showToast,
		offset,
		zoom,
		canvasRef,
	});

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
		} else if (clickedWall) {
			setSelected({ node: null, wall: clickedWall, ap: null });
		} else if (clickedAP) {
			setSelected({ node: null, wall: null, ap: clickedAP });
		} else {
			clearSelected();
			return;
		}
		openConfigSidebar();
	};

	useKeyboardShortcuts({
		selected,
		clearSelected,
		undo,
		redo,
		saveStateToHistory,
		setNodes,
		setWalls,
		setAccessPoints,
		setSelected,
	});

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
				<ToggleButton
					label="Grid"
					state={showGrid}
					onClick={() => toggle(setShowGrid)}
				/>

				<ToggleButton
					label="Rooms"
					state={showRooms}
					onClick={() => toggle(setShowRooms)}
				/>

				<ToggleButton
					label="Coverage"
					state={showCoverage}
					onClick={() => toggle(setShowCoverage)}
				/>

				<ToggleButton
					label="Units"
					state={showUnits}
					onClick={() => toggle(setShowUnits)}
				/>

				<ToggleButton
					label="Strength Numbers"
					state={showStrength}
					onClick={() => toggle(setShowStrength)}
				/>
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
