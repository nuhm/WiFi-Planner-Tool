/**
 * gridUtils.js
 *
 * Contains all utility functions for grid logic:
 * - Cursor snapping and coordinate math
 * - Node, wall, and AP selection helpers
 * - Line intersection and geometry
 * - Room detection support and snapping rules
 * - Grid centering logic
 *
 * Used across the canvas interaction and rendering system.
 */
import { v4 as uuidv4 } from 'uuid';
import {
	ALLOWED_ANGLES,
	AP_DISTANCE_THRESHOLD,
	DEFAULT_WALL_CONFIG,
	NODE_DISTANCE_THRESHOLD,
	WALL_MATCH_THRESHOLD,
} from '../constants/config';

// Snap floating point values to nearest grid cell
export function snapToGrid(x, y) {
	return {
		x: Math.round(x),
		y: Math.round(y),
	};
}

// Return distance from point to a line segment
export function distanceToSegment(p, a, b) {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	if (dx === 0 && dy === 0) return Math.hypot(p.x - a.x, p.y - a.y);

	const t = Math.max(
		0,
		Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy))
	);
	const projX = a.x + t * dx;
	const projY = a.y + t * dy;
	return Math.hypot(p.x - projX, p.y - projY);
}

function isBetween(val, a, b) {
	const min = Math.min(a, b) - 0.01;
	const max = Math.max(a, b) + 0.01;
	return val >= min && val <= max;
}

// Return intersection point of two line segments (or null)
export function getLineIntersection(p1, p2, p3, p4) {
	// Calculate the denominator of the intersection formula
	const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);

	if (denom === 0) return null; // Lines are parallel

	// Compute the intersection point using determinant-based formula
	const numX =
		(p1.x * p2.y - p1.y * p2.x) * (p3.x - p4.x) -
		(p1.x - p2.x) * (p3.x * p4.y - p3.y * p4.x);
	const numY =
		(p1.x * p2.y - p1.y * p2.x) * (p3.y - p4.y) -
		(p1.y - p2.y) * (p3.x * p4.y - p3.y * p4.x);

	const intersectionX = numX / denom;
	const intersectionY = numY / denom;

	// Check if the intersection point lies within both segments
	if (
		isBetween(intersectionX, p1.x, p2.x) &&
		isBetween(intersectionX, p3.x, p4.x) &&
		isBetween(intersectionY, p1.y, p2.y) &&
		isBetween(intersectionY, p3.y, p4.y)
	) {
		return { x: intersectionX, y: intersectionY };
	}

	return null;
}

export function getSnappedCursorPos(
	event,
	canvasRef,
	offset,
	zoom,
	snapToGrid,
	setCursorPos
) {
	const rect = canvasRef.current.getBoundingClientRect();
	const centerX = rect.width / 2;
	const centerY = rect.height / 2;
	const x = (event.clientX - rect.left - centerX - offset.x) / zoom;
	const y = (event.clientY - rect.top - centerY - offset.y) / zoom;
	const snappedPos = snapToGrid(x, y);
	setCursorPos(snappedPos);
	return snappedPos;
}

// Find or create a node at a snapped position
export function getOrCreateNode(snappedPos, nodesArr) {
	let node = nodesArr.find((n) => n.x === snappedPos.x && n.y === snappedPos.y);
	if (!node) {
		node = { id: uuidv4(), x: snappedPos.x, y: snappedPos.y };
		nodesArr.push(node);
	}
	return node;
}

/**
 * Attempts to split a wall at the clicked position (used when no lastAddedNode).
 * If the click is near a wall, the wall is split at the clicked point.
 * A new node is created at the intersection, and the wall is replaced by two segments.
 * If the click is not exactly at a snapped point, a second node is also created.
 */
export function trySplitWallAtClick(snappedPos, nodes, walls, snapToGrid) {
	let updatedNodes = [...nodes];
	let updatedWalls = [...walls];
	for (const wall of walls) {
		const dist = distanceToSegment(snappedPos, wall.a, wall.b);
		if (dist < 0.2) {
			const snapped = snapToGrid(snappedPos.x, snappedPos.y);
			let intersectionNode = updatedNodes.find(
				(n) => n.x === snapped.x && n.y === snapped.y
			);
			if (!intersectionNode) {
				intersectionNode = { id: uuidv4(), x: snapped.x, y: snapped.y };
				updatedNodes.push(intersectionNode);
			}
			updatedWalls = updatedWalls.filter((w) => w.id !== wall.id);
			if (wall.a.x !== intersectionNode.x || wall.a.y !== intersectionNode.y) {
				updatedWalls.push({
					id: uuidv4(),
					a: wall.a,
					b: intersectionNode,
					config: wall.config,
				});
			}
			if (wall.b.x !== intersectionNode.x || wall.b.y !== intersectionNode.y) {
				updatedWalls.push({
					id: uuidv4(),
					a: intersectionNode,
					b: wall.b,
					config: wall.config,
				});
			}
			// If the click is not exactly on the snapped node, add a node and wall segment
			if (
				snappedPos.x !== intersectionNode.x ||
				snappedPos.y !== intersectionNode.y
			) {
				const cursorNode = { id: uuidv4(), x: snappedPos.x, y: snappedPos.y };
				updatedNodes.push(cursorNode);
				updatedWalls.push({
					id: uuidv4(),
					a: intersectionNode,
					b: cursorNode,
					config: { ...DEFAULT_WALL_CONFIG },
				});
				return { nodes: updatedNodes, walls: updatedWalls, node: cursorNode };
			} else {
				return {
					nodes: updatedNodes,
					walls: updatedWalls,
					node: intersectionNode,
				};
			}
		}
	}
	return null;
}

/**
 * Attempts to split a wall where a new wall line (from lastAddedNode to cursor) intersects it.
 * If an intersection is found, the wall is split and the new wall is added from lastAddedNode to that point.
 */
export function trySplitWallWithLine(
	lastAddedNode,
	snappedPos,
	nodes,
	walls,
	snapToGrid
) {
	let updatedNodes = [...nodes];
	let updatedWalls = [...walls];
	for (const wall of walls) {
		const intersection = getLineIntersection(
			wall.a,
			wall.b,
			lastAddedNode,
			snappedPos
		);
		if (intersection) {
			const snapped = snapToGrid(intersection.x, intersection.y);
			let intersectionNode = updatedNodes.find(
				(n) => n.x === snapped.x && n.y === snapped.y
			);
			if (!intersectionNode) {
				intersectionNode = { id: uuidv4(), x: snapped.x, y: snapped.y };
				updatedNodes.push(intersectionNode);
			}
			updatedWalls = updatedWalls.filter((w) => w.id !== wall.id);
			if (wall.a.x !== intersectionNode.x || wall.a.y !== intersectionNode.y) {
				updatedWalls.push({
					id: uuidv4(),
					a: wall.a,
					b: intersectionNode,
					config: wall.config,
				});
			}
			if (wall.b.x !== intersectionNode.x || wall.b.y !== intersectionNode.y) {
				updatedWalls.push({
					id: uuidv4(),
					a: intersectionNode,
					b: wall.b,
					config: wall.config,
				});
			}
			// Connect lastAddedNode to intersectionNode
			updatedWalls.push({
				id: uuidv4(),
				a: lastAddedNode,
				b: intersectionNode,
				config: { ...DEFAULT_WALL_CONFIG },
			});
			// If the click is not exactly on the snapped node, add a node and wall segment
			if (
				snappedPos.x !== intersectionNode.x ||
				snappedPos.y !== intersectionNode.y
			) {
				const cursorNode = { id: uuidv4(), x: snappedPos.x, y: snappedPos.y };
				updatedNodes.push(cursorNode);
				updatedWalls.push({
					id: uuidv4(),
					a: intersectionNode,
					b: cursorNode,
					config: { ...DEFAULT_WALL_CONFIG },
				});
				return { nodes: updatedNodes, walls: updatedWalls, node: cursorNode };
			} else {
				return {
					nodes: updatedNodes,
					walls: updatedWalls,
					node: intersectionNode,
				};
			}
		}
	}
	return null;
}

/**
 * Finds and returns a node if the (x, y) position is within NODE_DISTANCE_THRESHOLD of it.
 * Used for selecting a node with the cursor.
 */
export function getNodeAtPoint(x, y, nodes) {
	for (const node of nodes) {
		const dist = Math.hypot(node.x - x, node.y - y);
		if (dist <= NODE_DISTANCE_THRESHOLD) return { ...node };
	}
	return null;
}

/**
 * Finds and returns a wall if the (x, y) position is within WALL_MATCH_THRESHOLD of it.
 * Uses perpendicular distance to check proximity to a line segment.
 */
export function getWallAtPoint(x, y, walls) {
	for (let i = 0; i < walls.length; i++) {
		const wall = walls[i];
		const { a, b } = wall;

		const dist = distanceToSegment({ x, y }, a, b);
		if (dist < WALL_MATCH_THRESHOLD) return wall;
	}
	return null;
}

/**
 * Finds and returns an access point (AP) if (x, y) is within AP_DISTANCE_THRESHOLD of it.
 */
export function getAPAtPoint(x, y, accessPoints) {
	for (const ap of accessPoints) {
		const dist = Math.hypot(ap.x - x, ap.y - y);
		if (dist <= AP_DISTANCE_THRESHOLD) return ap;
	}
	return null;
}

/**
 * Computes the area of a polygon using the shoelace formula.
 * Assumes points are ordered (clockwise or counter-clockwise).
 */
export const getPolygonArea = (points) => {
	let area = 0;
	const n = points.length;
	for (let i = 0; i < n; i++) {
		const { x: x1, y: y1 } = points[i];
		const { x: x2, y: y2 } = points[(i + 1) % n];
		area += x1 * y2 - x2 * y1;
	}
	return Math.abs(area / 2);
};

/**
 * Checks whether the angle between two points (dx, dy) is allowed based on ALLOWED_ANGLES.
 * Typically used to enforce snapping to 45° and 90° increments.
 */
export const isAllowedAngle = (dx, dy) => {
	const angle = Math.atan2(dy, dx) * (180 / Math.PI);
	const absAngle = Math.abs(angle);
	const epsilon = 0.01;

	return ALLOWED_ANGLES.some((a) => Math.abs(absAngle - a) < epsilon);
};

/**
 * Calculates and sets the initial canvas offset so the grid appears centered on screen.
 * Used when the canvas first loads.
 */
export const centerGrid = (setOffset) => {
	const newCenterX = window.innerWidth / 2;
	const newCenterY = window.innerHeight / 2;

	setOffset({
		x: -newCenterX,
		y: -newCenterY,
	});
};
