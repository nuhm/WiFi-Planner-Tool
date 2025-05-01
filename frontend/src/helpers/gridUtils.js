import { v4 as uuidv4 } from 'uuid';

export function snapToGrid(x, y) {
   return {
      x: Math.round(x),
      y: Math.round(y)
   };
};

export function distanceToSegment(p, a, b) {
   const dx = b.x - a.x;
   const dy = b.y - a.y;
   if (dx === 0 && dy === 0) return Math.hypot(p.x - a.x, p.y - a.y);

   const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
   const projX = a.x + t * dx;
   const projY = a.y + t * dy;
   return Math.hypot(p.x - projX, p.y - projY);
}

/* Function generated via ChatGPT */
export function getLineIntersection(p1, p2, p3, p4) {
   const denom = (p1.x - p2.x) * (p3.y - p4.y) - 
                 (p1.y - p2.y) * (p3.x - p4.x);
   if (denom === 0) return null; // Parallel lines
 
   const x = ((p1.x * p2.y - p1.y * p2.x) * (p3.x - p4.x) -
              (p1.x - p2.x) * (p3.x * p4.y - p3.y * p4.x)) / denom;
   const y = ((p1.x * p2.y - p1.y * p2.x) * (p3.y - p4.y) -
              (p1.y - p2.y) * (p3.x * p4.y - p3.y * p4.x)) / denom;
 
   const isBetween = (val, a, b) => {
     const min = Math.min(a, b) - 0.01;
     const max = Math.max(a, b) + 0.01;
     return val >= min && val <= max;
   };
 
   if (
     isBetween(x, p1.x, p2.x) && isBetween(x, p3.x, p4.x) &&
     isBetween(y, p1.y, p2.y) && isBetween(y, p3.y, p4.y)
   ) {
     return { x, y };
   }
 
   return null;
 }

// Get snapped cursor position from event
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

// Create or reuse node at snapped position
export function getOrCreateNode(snappedPos, nodesArr) {
   let node = nodesArr.find(n => n.x === snappedPos.x && n.y === snappedPos.y);
   if (!node) {
      node = { id: uuidv4(), x: snappedPos.x, y: snappedPos.y };
      nodesArr.push(node);
   }
   return node;
}

// Try to split an existing wall at the click (when no lastAddedNode)
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
            config: { material: 'drywall', thickness: 10 }
            });
            return { nodes: updatedNodes, walls: updatedWalls, node: cursorNode };
         } else {
            return { nodes: updatedNodes, walls: updatedWalls, node: intersectionNode };
         }
      }
   }
   return null;
}

// Try to split a wall with a line from lastAddedNode to snappedPos
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
            config: { material: 'drywall', thickness: 10 }
         });
         // If the click is not exactly on the snapped node, add a node and wall segment
         if (snappedPos.x !== intersectionNode.x || snappedPos.y !== intersectionNode.y) {
            const cursorNode = { id: uuidv4(), x: snappedPos.x, y: snappedPos.y };
            updatedNodes.push(cursorNode);
            updatedWalls.push({
            id: uuidv4(),
            a: intersectionNode,
            b: cursorNode,
            config: { material: 'drywall', thickness: 10 }
            });
            return { nodes: updatedNodes, walls: updatedWalls, node: cursorNode };
         } else {
            return { nodes: updatedNodes, walls: updatedWalls, node: intersectionNode };
         }
      }
   }
   return null;
}