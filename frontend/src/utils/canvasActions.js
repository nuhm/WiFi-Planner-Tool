import { v4 as uuidv4 } from 'uuid';
import {
	getOrCreateNode,
	trySplitWallAtClick,
	trySplitWallWithLine,
	snapToGrid,
	distanceToSegment,
} from './gridUtils';
import {
	DEFAULT_AP_CONFIG,
	DEFAULT_WALL_CONFIG,
	NODE_DISTANCE_THRESHOLD,
	WALL_MATCH_THRESHOLD,
	AP_DISTANCE_THRESHOLD,
} from '../constants/config';

/**
 * Adds a node, potentially splitting or connecting to walls.
 */
export const addNodeLogic = ({
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
}) => {
	const snappedPos = getSnappedCursorPos(
		event,
		canvasRef,
		offset,
		zoom,
		snapToGrid,
		setCursorPos
	);

	if (!lastAddedNode) {
		const splitResult = trySplitWallAtClick(
			snappedPos,
			nodes,
			walls,
			snapToGrid
		);
		if (splitResult) {
			setNodes(splitResult.nodes);
			setWalls(splitResult.walls);
			setLastAddedNode(splitResult.node);
			setSelected({ node: splitResult.node, wall: null, ap: null });
			return;
		}
	}

	let updatedNodes = [...nodes];
	let updatedWalls = [...walls];
	let newNode = null;
	let splitOccurred = false;

	if (lastAddedNode) {
		const splitResult = trySplitWallWithLine(
			lastAddedNode,
			snappedPos,
			updatedNodes,
			updatedWalls,
			snapToGrid
		);
		if (splitResult) {
			updatedNodes = splitResult.nodes;
			updatedWalls = splitResult.walls;
			newNode = splitResult.node;
			splitOccurred = true;
		}
	}

	if (lastAddedNode && !splitOccurred) {
		const dx = snappedPos.x - lastAddedNode.x;
		const dy = snappedPos.y - lastAddedNode.y;
		if (!isAllowedAngle(dx, dy)) {
			showToast('Node must be placed at 45° or 90° angle.');
			return;
		}
	}

	if (!newNode) {
		newNode = getOrCreateNode(snappedPos, updatedNodes);
	}

	let newWalls = [];
	if (lastAddedNode && !splitOccurred) {
		if (newNode.x === lastAddedNode.x && newNode.y === lastAddedNode.y) {
			setSelected({ node: null, wall: null, ap: null });
			setLastAddedNode(null);
			return;
		}

		newWalls.push({
			id: uuidv4(),
			a: lastAddedNode,
			b: newNode,
			config: { ...DEFAULT_WALL_CONFIG },
		});
	}

	setNodes(updatedNodes);
	setWalls([...updatedWalls, ...newWalls]);
	setLastAddedNode(newNode);
	setSelected({ node: newNode, wall: null, ap: null });
};

/**
 * Deletes a node at a given position and removes associated walls.
 */
export const deleteNodeLogic = ({
	event,
	canvasRef,
	offset,
	zoom,
	snapToGrid,
	setNodes,
	setWalls,
	setCursorPos,
}) => {
	const snappedPos = getSnappedCursorPos(
		event,
		canvasRef,
		offset,
		zoom,
		snapToGrid,
		setCursorPos
	);

	setNodes((prevNodes) =>
		prevNodes.filter(
			(node) =>
				Math.hypot(node.x - snappedPos.x, node.y - snappedPos.y) >
				NODE_DISTANCE_THRESHOLD
		)
	);

	setWalls((prevWalls) =>
		prevWalls.filter(({ a, b }) => {
			const matchesA =
				Math.abs(a.x - snappedPos.x) < WALL_MATCH_THRESHOLD &&
				Math.abs(a.y - snappedPos.y) < WALL_MATCH_THRESHOLD;
			const matchesB =
				Math.abs(b.x - snappedPos.x) < WALL_MATCH_THRESHOLD &&
				Math.abs(b.y - snappedPos.y) < WALL_MATCH_THRESHOLD;
			return !(matchesA || matchesB);
		})
	);
};

/**
 * Adds an access point at a given position if it's not inside a wall or overlapping another AP.
 */
export const addAPLogic = ({
	event,
	canvasRef,
	offset,
	zoom,
	accessPoints,
	walls,
	setAccessPoints,
	showToast,
	setCursorPos,
}) => {
	const snappedPos = getSnappedCursorPos(
		event,
		canvasRef,
		offset,
		zoom,
		snapToGrid,
		setCursorPos
	);

	const collidesWithAP = accessPoints.some(
		(ap) =>
			Math.hypot(ap.x - snappedPos.x, ap.y - snappedPos.y) <
			AP_DISTANCE_THRESHOLD
	);
	if (collidesWithAP) {
		showToast('❌ Cannot place AP on top of another AP.');
		return;
	}

	const collidesWithWall = walls.some(
		({ a, b }) => distanceToSegment(snappedPos, a, b) < WALL_MATCH_THRESHOLD
	);
	if (collidesWithWall) {
		showToast('❌ Cannot place AP inside a wall.');
		return;
	}

	setAccessPoints((prev) => [
		...prev,
		{
			id: uuidv4(),
			x: snappedPos.x,
			y: snappedPos.y,
			name: `Access Point #${prev.length + 1}`,
			config: { ...DEFAULT_AP_CONFIG },
		},
	]);
};

/**
 * Deletes an access point at a given cursor position.
 */
export const deleteAPLogic = ({
	event,
	canvasRef,
	offset,
	zoom,
	setAccessPoints,
	setCursorPos,
}) => {
	const snappedPos = getSnappedCursorPos(
		event,
		canvasRef,
		offset,
		zoom,
		snapToGrid,
		setCursorPos
	);

	setAccessPoints((prev) =>
		prev.filter(
			(ap) =>
				Math.hypot(ap.x - snappedPos.x, ap.y - snappedPos.y) >
				AP_DISTANCE_THRESHOLD
		)
	);
};

/**
 * Helper for cursor snapping and transformation.
 */
function getSnappedCursorPos(
	event,
	canvasRef,
	offset,
	zoom,
	snapToGrid,
	setCursorPos
) {
	const rect = canvasRef.current.getBoundingClientRect();
	const x =
		(event.clientX - rect.left - canvasRef.current.width / 2 - offset.x) / zoom;
	const y =
		(event.clientY - rect.top - canvasRef.current.height / 2 - offset.y) / zoom;
	const snapped = snapToGrid(x, y);
	setCursorPos(snapped);
	return snapped;
}
