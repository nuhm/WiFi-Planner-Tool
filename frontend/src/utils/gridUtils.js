import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_WALL_CONFIG } from '../constants/config';

/**
 * Snaps a given (x, y) coordinate to the nearest integer grid point.
 * @param {number} x - The x coordinate.
 * @param {number} y - The y coordinate.
 * @returns {{x: number, y: number}} Snapped grid coordinates.
 */
export function snapToGrid(x, y) {
   return {
      x: Math.round(x),
      y: Math.round(y)
   };
};

/**
 * Calculates the shortest distance from point p to the line segment ab.
 * @param {{x: number, y: number}} p - The point.
 * @param {{x: number, y: number}} a - Segment start.
 * @param {{x: number, y: number}} b - Segment end.
 * @returns {number} The distance from p to the segment ab.
 */
export function distanceToSegment(p, a, b) {
   const dx = b.x - a.x;
   const dy = b.y - a.y;
   if (dx === 0 && dy === 0) return Math.hypot(p.x - a.x, p.y - a.y);

   const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
   const projX = a.x + t * dx;
   const projY = a.y + t * dy;
   return Math.hypot(p.x - projX, p.y - projY);
}

/**
 * Determines the intersection point of two line segments, or returns null if they do not intersect.
 * @param {{x: number, y: number}} p1 - First point of first segment.
 * @param {{x: number, y: number}} p2 - Second point of first segment.
 * @param {{x: number, y: number}} p3 - First point of second segment.
 * @param {{x: number, y: number}} p4 - Second point of second segment.
 * @returns {{x: number, y: number}|null} The intersection point or null.
 */
/**
 * Checks if a value is between two others, with a small margin of error.
 * @param {number} val - The value to check.
 * @param {number} a - One endpoint.
 * @param {number} b - The other endpoint.
 * @returns {boolean} True if val is between a and b.
 */
function isBetween(val, a, b) {
const min = Math.min(a, b) - 0.01;
const max = Math.max(a, b) + 0.01;
return val >= min && val <= max;
}

/**
 * Determines the intersection point of two line segments, or returns null if they do not intersect.
 * @param {{x: number, y: number}} p1 - First point of first segment.
 * @param {{x: number, y: number}} p2 - Second point of first segment.
 * @param {{x: number, y: number}} p3 - First point of second segment.
 * @param {{x: number, y: number}} p4 - Second point of second segment.
 * @returns {{x: number, y: number}|null} The intersection point or null.
 */
export function getLineIntersection(p1, p2, p3, p4) {
   // Calculate the denominator of the intersection formula
   const denom = (p1.x - p2.x) * (p3.y - p4.y) -
                  (p1.y - p2.y) * (p3.x - p4.x);

   if (denom === 0) return null; // Lines are parallel

   // Compute the intersection point using determinant-based formula
   const numX = (p1.x * p2.y - p1.y * p2.x) * (p3.x - p4.x) -
                  (p1.x - p2.x) * (p3.x * p4.y - p3.y * p4.x);
   const numY = (p1.x * p2.y - p1.y * p2.x) * (p3.y - p4.y) -
                  (p1.y - p2.y) * (p3.x * p4.y - p3.y * p4.x);

   const intersectionX = numX / denom;
   const intersectionY = numY / denom;

   // Check if the intersection point lies within both segments
   if (
      isBetween(intersectionX, p1.x, p2.x) && isBetween(intersectionX, p3.x, p4.x) &&
      isBetween(intersectionY, p1.y, p2.y) && isBetween(intersectionY, p3.y, p4.y)
   ) {
      return { x: intersectionX, y: intersectionY };
   }

   return null;
}

/**
 * Gets the snapped cursor position from a mouse event.
 * @param {MouseEvent} event - The mouse event.
 * @param {object} canvasRef - Reference to the canvas element.
 * @param {{x: number, y: number}} offset - The current canvas offset.
 * @param {number} zoom - The current zoom level.
 * @param {function} snapToGrid - Function to snap to grid.
 * @param {function} setCursorPos - Callback to set the cursor position.
 * @returns {{x: number, y: number}} The snapped cursor position.
 */
export function getSnappedCursorPos(event, canvasRef, offset, zoom, snapToGrid, setCursorPos) {
   const rect = canvasRef.current.getBoundingClientRect();
   const centerX = rect.width / 2;
   const centerY = rect.height / 2;
   const x = (event.clientX - rect.left - centerX - offset.x) / zoom;
   const y = (event.clientY - rect.top - centerY - offset.y) / zoom;
   const snappedPos = snapToGrid(x, y);
   setCursorPos(snappedPos);
   return snappedPos;
}

/**
 * Creates a new node at the snapped position or returns an existing node if one exists.
 * @param {{x: number, y: number}} snappedPos - The snapped position.
 * @param {Array} nodesArr - The array of existing nodes.
 * @returns {object} The created or found node.
 */
export function getOrCreateNode(snappedPos, nodesArr) {
   let node = nodesArr.find(n => n.x === snappedPos.x && n.y === snappedPos.y);
   if (!node) {
      node = { id: uuidv4(), x: snappedPos.x, y: snappedPos.y };
      nodesArr.push(node);
   }
   return node;
}

/**
 * Splits an existing wall at the clicked position (when no lastAddedNode).
 * @param {{x: number, y: number}} snappedPos - The snapped position.
 * @param {Array} nodes - The current nodes.
 * @param {Array} walls - The current walls.
 * @param {function} snapToGrid - Function to snap to grid.
 * @returns {{nodes: Array, walls: Array, node: object}|null} The updated state or null.
 */
export function trySplitWallAtClick(snappedPos, nodes, walls, snapToGrid) {
   let updatedNodes = [...nodes];
   let updatedWalls = [...walls];
   for (const wall of walls) {
      const dist = distanceToSegment(snappedPos, wall.a, wall.b);
      if (dist < 0.2) {
         const snapped = snapToGrid(snappedPos.x, snappedPos.y);
         let intersectionNode = updatedNodes.find(n => n.x === snapped.x && n.y === snapped.y);
         if (!intersectionNode) {
            intersectionNode = { id: uuidv4(), x: snapped.x, y: snapped.y };
            updatedNodes.push(intersectionNode);
         }
         updatedWalls = updatedWalls.filter(w => w.id !== wall.id);
         if (wall.a.x !== intersectionNode.x || wall.a.y !== intersectionNode.y) {
            updatedWalls.push({ id: uuidv4(), a: wall.a, b: intersectionNode, config: wall.config });
         }
         if (wall.b.x !== intersectionNode.x || wall.b.y !== intersectionNode.y) {
            updatedWalls.push({ id: uuidv4(), a: intersectionNode, b: wall.b, config: wall.config });
         }
         // If the click is not exactly on the snapped node, add a node and wall segment
         if (snappedPos.x !== intersectionNode.x || snappedPos.y !== intersectionNode.y) {
            const cursorNode = { id: uuidv4(), x: snappedPos.x, y: snappedPos.y };
            updatedNodes.push(cursorNode);
            updatedWalls.push({
            id: uuidv4(),
            a: intersectionNode,
            b: cursorNode,
            config: { ...DEFAULT_WALL_CONFIG }
            });
            return { nodes: updatedNodes, walls: updatedWalls, node: cursorNode };
         } else {
            return { nodes: updatedNodes, walls: updatedWalls, node: intersectionNode };
         }
      }
   }
   return null;
}

/**
 * Splits a wall with a line from lastAddedNode to snappedPos.
 * @param {object} lastAddedNode - The last added node.
 * @param {{x: number, y: number}} snappedPos - The snapped position.
 * @param {Array} nodes - The current nodes.
 * @param {Array} walls - The current walls.
 * @param {function} snapToGrid - Function to snap to grid.
 * @returns {{nodes: Array, walls: Array, node: object}|null} The updated state or null.
 */
export function trySplitWallWithLine(lastAddedNode, snappedPos, nodes, walls, snapToGrid) {
   let updatedNodes = [...nodes];
   let updatedWalls = [...walls];
   for (const wall of walls) {
      const intersection = getLineIntersection(wall.a, wall.b, lastAddedNode, snappedPos);
      if (intersection) {
         const snapped = snapToGrid(intersection.x, intersection.y);
         let intersectionNode = updatedNodes.find(n => n.x === snapped.x && n.y === snapped.y);
         if (!intersectionNode) {
            intersectionNode = { id: uuidv4(), x: snapped.x, y: snapped.y };
            updatedNodes.push(intersectionNode);
         }
         updatedWalls = updatedWalls.filter(w => w.id !== wall.id);
         if (wall.a.x !== intersectionNode.x || wall.a.y !== intersectionNode.y) {
            updatedWalls.push({ id: uuidv4(), a: wall.a, b: intersectionNode, config: wall.config });
         }
         if (wall.b.x !== intersectionNode.x || wall.b.y !== intersectionNode.y) {
            updatedWalls.push({ id: uuidv4(), a: intersectionNode, b: wall.b, config: wall.config });
         }
         // Connect lastAddedNode to intersectionNode
         updatedWalls.push({
            id: uuidv4(),
            a: lastAddedNode,
            b: intersectionNode,
            config: { ...DEFAULT_WALL_CONFIG }
         });
         // If the click is not exactly on the snapped node, add a node and wall segment
         if (snappedPos.x !== intersectionNode.x || snappedPos.y !== intersectionNode.y) {
            const cursorNode = { id: uuidv4(), x: snappedPos.x, y: snappedPos.y };
            updatedNodes.push(cursorNode);
            updatedWalls.push({
            id: uuidv4(),
            a: intersectionNode,
            b: cursorNode,
            config: { ...DEFAULT_WALL_CONFIG }
            });
            return { nodes: updatedNodes, walls: updatedWalls, node: cursorNode };
         } else {
            return { nodes: updatedNodes, walls: updatedWalls, node: intersectionNode };
         }
      }
   }
   return null;
}