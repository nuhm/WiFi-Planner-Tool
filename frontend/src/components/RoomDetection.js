// RoomDetection.js

export const detectRooms = (walls) => {
   const graph = buildGraph(walls);
   const allRooms = new Set();
 
   const maxDepth = 20;
 
   const dfs = (start, current, path, visitedEdges) => {
     if (path.length > maxDepth) return;
 
     const neighbors = graph[`${current.x},${current.y}`] || [];
     for (const next of neighbors) {
       const edge = getEdgeKey(current, next);
       if (visitedEdges.has(edge)) continue;
 
       const newPath = [...path, next];
       const newVisited = new Set(visitedEdges);
       newVisited.add(edge);
 
       if (next.x === start.x && next.y === start.y && newPath.length >= 4) {
         const norm = normalizeLoop(newPath);
         allRooms.add(norm);
       } else if (!path.some(p => p.x === next.x && p.y === next.y)) {
         dfs(start, next, newPath, newVisited);
       }
     }
   };
 
   for (const key in graph) {
     const [x, y] = key.split(',').map(Number);
     const start = { x, y };
     dfs(start, start, [start], new Set());
   }
 
   const decodedRooms = Array.from(allRooms).map(decodePath);
   return filterContainedRooms(decodedRooms);
 };
 
 // ---- Helpers ----
 const buildGraph = (walls) => {
   const graph = {};
   walls.forEach(([a, b]) => {
     const keyA = `${a.x},${a.y}`;
     const keyB = `${b.x},${b.y}`;
     graph[keyA] = graph[keyA] || [];
     graph[keyB] = graph[keyB] || [];
     graph[keyA].push(b);
     graph[keyB].push(a);
   });
   return graph;
 };
 
 const getEdgeKey = (a, b) => {
   const key1 = `${a.x},${a.y}`;
   const key2 = `${b.x},${b.y}`;
   return [key1, key2].sort().join('|');
 };
 
 const normalizeLoop = (path) => {
   const nodes = path.slice(0, -1); // exclude final node (== start)
   const rotated = [...nodes];
   const strForms = [];
   for (let i = 0; i < nodes.length; i++) {
     const r = [...rotated.slice(i), ...rotated.slice(0, i)];
     const fwd = r.map(n => `${n.x},${n.y}`).join('|');
     const rev = [...r].reverse().map(n => `${n.x},${n.y}`).join('|');
     strForms.push(fwd, rev);
   }
   return strForms.sort()[0];
 };
 
 const decodePath = (str) =>
   str.split('|').map(s => {
     const [x, y] = s.split(',').map(Number);
     return { x, y };
   });
 
 const polygonArea = (points) => {
   let area = 0;
   const n = points.length;
   for (let i = 0; i < n; i++) {
     const j = (i + 1) % n;
     area += points[i].x * points[j].y;
     area -= points[j].x * points[i].y;
   }
   return Math.abs(area / 2);
 };
 
 const pointInPolygon = (point, polygon) => {
   let inside = false;
   for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
     const xi = polygon[i].x, yi = polygon[i].y;
     const xj = polygon[j].x, yj = polygon[j].y;
 
     const intersect = ((yi > point.y) !== (yj > point.y)) &&
       (point.x < (xj - xi) * (point.y - yi) / (yj - yi + 0.0001) + xi);
     if (intersect) inside = !inside;
   }
   return inside;
 };
 
 const filterContainedRooms = (rooms) => {
   const sorted = rooms.slice().sort((a, b) => polygonArea(a) - polygonArea(b));
   const result = [];
 
   sorted.forEach(room => {
     const centroid = {
       x: room.reduce((sum, p) => sum + p.x, 0) / room.length,
       y: room.reduce((sum, p) => sum + p.y, 0) / room.length
     };
 
     const insideAnother = result.some(other => pointInPolygon(centroid, other));
 
     if (!insideAnother) {
       result.push(room);
     }
   });
 
   return result;
 };
 