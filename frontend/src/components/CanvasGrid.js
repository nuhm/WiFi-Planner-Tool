import React, { useEffect, useRef, useState } from "react";
import { detectRooms } from '../components/RoomDetection';
import "../styles/Workspace.css";
import { useToast } from './ToastContext';

const CanvasGrid = ({ isPanning, isAddingNode, isDeletingNode, isSelecting, isPlacingAP, nodes, setNodes, walls, setWalls, selectedNode, setSelectedNode, lastAddedNode, setLastAddedNode, selectedAP, setSelectedAP, onSelectAP, accessPoints, setAccessPoints }) => {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [previewNode, setPreviewNode] = useState(null);
  const [previewAP, setPreviewAP] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isValidPreview, setIsValidPreview] = useState(true);
  const roomColorsRef = useRef({});
  const [selectedWall, setSelectedWall] = useState(null);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [roomShapes, setRoomShapes] = useState([]);
  


  const { showToast } = useToast();
  
  const MAX_HISTORY_LENGTH = 20;
  const saveStateToHistory = () => {
    const state = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      walls: JSON.parse(JSON.stringify(walls)),
    };
    setHistory((prev) => [...prev.slice(-MAX_HISTORY_LENGTH + 1), state]);
    setRedoStack([]); // Clear redo stack on new change
  };

  const dragStart = useRef({ x: 0, y: 0 });

  // Zoom handling with manual event listener for non-passive event
  const handleZoom = (event) => {
    event.preventDefault(); // Prevent the default scroll behavior
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    setZoom(Math.max(0.2, Math.min(zoom * zoomFactor, 5)));
  };

  useEffect(() => {
    if (!isAddingNode) {
      setLastAddedNode(null);
    }
  }, [isAddingNode]);

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
    const filtered = allRooms.filter(room => getPolygonArea(room) >= 10);
    setRoomShapes(filtered);
  }, [walls]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const baseGridSize = 50;
    const gridSize = baseGridSize * zoom;
    const subGridSize = gridSize / 5;

    canvas.width = window.innerWidth * 2;
    canvas.height = window.innerHeight * 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // **Set (0,0) to Grid Center**
    const centerX = canvas.width / 2 + offset.x;
    const centerY = canvas.height / 2 + offset.y;

    if (showGrid) {
      // **Draw Sub-Grid (Only if zoomed in)**
      var subGridZoomActivation = 0.5;
      if (zoom > subGridZoomActivation) {
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 0.5;
        for (let x = centerX % subGridSize; x < canvas.width; x += subGridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = centerY % subGridSize; y < canvas.height; y += subGridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }
      
      // Draw sub-sub-grid (1/4 of subGridSize)
      if (zoom > (subGridZoomActivation * 4)) {
        const subSubGridSize = subGridSize / 2;
        ctx.strokeStyle = "#555";
        ctx.lineWidth = 0.25;
        for (let x = centerX % subSubGridSize; x < canvas.width; x += subSubGridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = centerY % subSubGridSize; y < canvas.height; y += subSubGridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }

      // **Draw Main Grid**
      ctx.strokeStyle = "#777";
      ctx.lineWidth = 1;
      for (let x = centerX % gridSize; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = centerY % gridSize; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // **Draw Center Crosshair (Always Visible)**
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(canvas.width, centerY);
      ctx.stroke();
    }

    let roomColorsRef = {};
    let nextHue = 0;

    // Fill Rooms First
    roomShapes.forEach(nodes => {
      ctx.beginPath();
      nodes.forEach(({ x, y }, i) => {
        const screenX = centerX + x * zoom;
        const screenY = centerY + y * zoom;
        if (i === 0) ctx.moveTo(screenX, screenY);
        else ctx.lineTo(screenX, screenY);
      });
      ctx.closePath();

      const key = nodes.map(n => `${n.x},${n.y}`).sort().join('|');
      if (!roomColorsRef[key]) {
        const hue = (nextHue * 137.508) % 360; // golden angle for better spread
        roomColorsRef[key] = `hsla(${hue}, 80%, 60%, 0.15)`;
        nextHue++;
      }

      ctx.fillStyle = roomColorsRef[key];
      ctx.fill();
    });

    console.log(`🟨 Detected ${roomShapes.length} unique room(s).`);
    
    // === WiFi Signal Heatmap Rendering ===
    const d0 = 1;
    const pl0 = 30;
    const n = 2.2;
    const txPower = 10;
    const maxRange = 400; // in world units
    const gridStep = baseGridSize / 5;
    
    const signalToColor = (dbm) => {
      if (dbm > -50) return "rgba(0,255,0,0.25)";
      if (dbm > -70) return "rgba(255,255,0,0.25)";
      if (dbm > -85) return "rgba(255,165,0,0.25)";
      return "rgba(255,0,0,0.25)";
    };
    
    accessPoints.forEach(ap => {
      const steps = Math.floor(maxRange / gridStep);
      for (let i = -steps; i <= steps; i++) {
        for (let j = -steps; j <= steps; j++) {
          const dx = i * gridStep;
          const dy = j * gridStep;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > maxRange) continue;
          
          const worldX = ap.x - (gridStep / 2) + dx;
          const worldY = ap.y - (gridStep / 2) + dy;
          
          // Block signal if wall is between AP and this grid point
          const obstructed = walls.some(([a, b]) =>
            getLineIntersection({ x: ap.x, y: ap.y }, { x: worldX, y: worldY }, a, b)
          );
          if (obstructed) continue;
    
          const pathLoss = pl0 + 10 * n * Math.log10(dist / d0);
          const signal = txPower - pathLoss;
    
          if (signal > -90) {
            const screenX = centerX + worldX * zoom;
            const screenY = centerY + worldY * zoom;
    
            ctx.fillStyle = signalToColor(signal);
            ctx.fillRect(screenX - (gridStep * zoom) / 2, screenY - (gridStep * zoom) / 2, gridStep * zoom, gridStep * zoom);
          }
        }
      }
    });
    
    // **Draw Walls (Lines between nodes)**
    walls.forEach((wall) => {
      const [startNode, endNode] = wall;
    
      const startX = centerX + startNode.x * zoom;
      const startY = centerY + startNode.y * zoom;
      const endX = centerX + endNode.x * zoom;
      const endY = centerY + endNode.y * zoom;
    
      ctx.lineWidth = 6;
    
      if (selectedWall === wall) {
        ctx.strokeStyle = "orange";
      } else {
        ctx.strokeStyle = "gray";
      }
    
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    });

    // **Draw Nodes**
    ctx.fillStyle = "darkgray";
    nodes.forEach(({ x, y }) => {
      ctx.beginPath();
      ctx.arc(centerX + x * zoom, centerY + y * zoom, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Access Points as squares
    ctx.fillStyle = "white";
    accessPoints.forEach(ap => {
      const apScreenX = centerX + ap.x * zoom;
      const apScreenY = centerY + ap.y * zoom;
      ctx.beginPath();
      ctx.arc(apScreenX, apScreenY, maxRange * zoom, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,255,0,0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      const screenX = centerX + ap.x * zoom;
      const screenY = centerY + ap.y * zoom;
      const size = 12;
    
      ctx.fillRect(screenX - size / 2, screenY - size / 2, size, size);

      if (ap.name) {
        ctx.font = `${6 * zoom}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(ap.name, screenX, screenY - size / 2 - 2);
      }
    });

    // Highlight selected AP
    if (selectedAP) {
      const screenX = centerX + selectedAP.x * zoom;
      const screenY = centerY + selectedAP.y * zoom;
      const size = 16;

      ctx.strokeStyle = "orange";
      ctx.lineWidth = 3;
      ctx.strokeRect(screenX - size / 2, screenY - size / 2, size, size);
    }

    // **Draw Preview Node (Ghost)**
    if (previewNode) {
      ctx.fillStyle = isValidPreview
      ? "rgba(0, 255, 0, 0.5)"   // Green = valid
      : "rgba(255, 0, 0, 0.3)"; // Red = invalid
      ctx.beginPath();
      ctx.arc(centerX + previewNode.x * zoom, centerY + previewNode.y * zoom, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // **Draw Preview AP (Ghost)**
    if (previewAP) {
      const screenX = centerX + previewAP.x * zoom;
      const screenY = centerY + previewAP.y * zoom;
      const size = 12;

      ctx.fillStyle = "rgba(0, 255, 0, 0.4)";
      ctx.fillRect(screenX - size / 2, screenY - size / 2, size, size);
    }

    if (selectedNode && previewNode && isAddingNode) {
      const startX = centerX + selectedNode.x * zoom;
      const startY = centerY + selectedNode.y * zoom;
      const endX = centerX + previewNode.x * zoom;
      const endY = centerY + previewNode.y * zoom;
    
      ctx.strokeStyle = isValidPreview ? "rgba(0,255,0,0.7)" : "rgba(255,0,0,0.4)";
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash
    }

    // ✅ Draw Selected Node Highlight (after normal nodes)
    if (selectedNode) {
      const selectedX = centerX + selectedNode.x * zoom;
      const selectedY = centerY + selectedNode.y * zoom;
    
      // Outline
      ctx.beginPath();
      ctx.arc(selectedX, selectedY, 8, 0, Math.PI * 2);
      ctx.strokeStyle = "yellow";
      ctx.lineWidth = 3;
      ctx.stroke();
    }    

  }, [zoom, offset, showGrid, nodes, previewNode, previewAP, walls, selectedNode, selectedWall, accessPoints, selectedAP, roomShapes]);

  useEffect(() => {
    if (!isLoaded) {
      setIsLoaded(!isLoaded);
      centerGrid();
    }
  }, [isLoaded]);

  /* Function generated via ChatGPT */
  function getLineIntersection(p1, p2, p3, p4) {
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

  const isAllowedAngle = (dx, dy) => {
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const absAngle = Math.abs(angle);
    const allowedAngles = [0, 45, 90, 135, 180];
    const epsilon = 0.01;
  
    return allowedAngles.some(a => Math.abs(absAngle - a) < epsilon);
  };  

  const clearSelected = () => {
    setLastAddedNode(null);
    setSelectedNode(null);
    setSelectedWall(null);
    setSelectedAP(null);
  };

  const toggleGrid = () => {
    setShowGrid((prev) => !prev);
  };

  const snapToGrid = (x, y) => {
    const baseGridSize = 10;
    return {
      x: Math.round(x / baseGridSize) * baseGridSize,
      y: Math.round(y / baseGridSize) * baseGridSize
    };
  };

  const lastUpdate = useRef(Date.now());
  const handleMouseMove = (event) => {
    const now = Date.now();
    if (now - lastUpdate.current < 16) return; // 60fps max
    lastUpdate.current = now;

    handlePan(event);
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // **Convert mouse position to grid-based position**
    const x = (event.clientX - rect.left - centerX - offset.x) / zoom;
    const y = (event.clientY - rect.top - centerY - offset.y) / zoom;

    // **Snap position**
    const snappedPos = snapToGrid(x, y);
    setCursorPos(snappedPos);

    // **Update preview node**
    if (isAddingNode) {
      setPreviewNode(snappedPos);
    
      if (lastAddedNode) {
        const dx = snappedPos.x - lastAddedNode.x;
        const dy = snappedPos.y - lastAddedNode.y;
        setIsValidPreview(isAllowedAngle(dx, dy));
      } else {
        setIsValidPreview(true); // No constraint if no previous node
      }
    } else {
      setPreviewNode(null);
    }

    if (isPlacingAP) {
      setPreviewAP(snappedPos);
    }
    else {
      setPreviewAP(null);
    }
  };

  const handleMouseDown = (event) => {

    clearSelected();
    
    if (isPlacingAP) {
      const rect = canvasRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
    
      const x = (event.clientX - rect.left - centerX - offset.x) / zoom;
      const y = (event.clientY - rect.top - centerY - offset.y) / zoom;
    
      const snapped = snapToGrid(x, y);
    
      if (event.button === 2) {
        // Right-click to delete nearest AP
        setAccessPoints(prev => prev.filter(ap => {
          const dist = Math.hypot(ap.x - snapped.x, ap.y - snapped.y);
          return dist > 10;
        }));
      } else if (event.button === 0) {
        // Left-click to add new AP
        setAccessPoints(prev => {
          const newName = `Access Point #${accessPoints.length + 1}`;
          return [...prev, { x: snapped.x, y: snapped.y, name: newName }];
        });
      }
    
      return;
    }

    if (event.button === 1) {
      startPan(event);
    }

    if (event.button !== 0) return; // Left click only

    if (isPanning) {
      startPan(event);
      return;
    }

    if (isSelecting) {
      startSelect(event);
      return;
    }
  
    if (isAddingNode) {
      addNode(event);
    } else if (isDeletingNode) {
      deleteNode(event);
    }
  };

  // 🔹 Function to add a node at cursor position
  const addNode = (event) => {
    saveStateToHistory();
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
  
    const x = (event.clientX - rect.left - centerX - offset.x) / zoom;
    const y = (event.clientY - rect.top - centerY - offset.y) / zoom;
  
    const snappedPos = snapToGrid(x, y);
    setCursorPos(snappedPos);
  
    const existingNode = nodes.find(node => node.x === snappedPos.x && node.y === snappedPos.y);
    const newNode = existingNode || snappedPos;
  
    // Prevent linking same node to itself
    if (lastAddedNode && newNode.x === lastAddedNode.x && newNode.y === lastAddedNode.y) {
      clearSelected();
      return;
    }
  
    // Ensure angle is allowed
    if (lastAddedNode) {
      const dx = newNode.x - lastAddedNode.x;
      const dy = newNode.y - lastAddedNode.y;
      if (!isAllowedAngle(dx, dy)) {
        showToast('⛔ Node must be placed at 45° or 90° angle.')
        return;
      }
    }
  
    const newWalls = lastAddedNode ? [[lastAddedNode, newNode]] : [];
    let updatedNodes = [...nodes];
    let updatedWalls = [...walls];
  
    const isSameWall = (w1, w2) => {
      const norm = ([a, b]) => (a.x < b.x || (a.x === b.x && a.y < b.y)) ? [a, b] : [b, a];
      const [a1, b1] = norm(w1);
      const [a2, b2] = norm(w2);
      return a1.x === a2.x && a1.y === a2.y && b1.x === b2.x && b1.y === b2.y;
    };
  
    if (lastAddedNode) {
      walls.forEach(([a, b]) => {
        const intersection = getLineIntersection(a, b, lastAddedNode, newNode);
        if (intersection) {
          const snapped = snapToGrid(intersection.x, intersection.y);
          const exists = updatedNodes.some(n => n.x === snapped.x && n.y === snapped.y);
  
          if (!exists) {
            updatedNodes.push(snapped);
          }
  
          updatedWalls = updatedWalls.filter(w => !isSameWall(w, [a, b]));
          updatedWalls.push([a, snapped], [snapped, b]);
  
          newWalls.length && newWalls.pop();
          newWalls.push([lastAddedNode, snapped], [snapped, newNode]);
        }
      });
    }
  
    // Only add the node if it doesn't already exist
    if (!existingNode) {
      updatedNodes.push(newNode);
    }
  
    setNodes(updatedNodes);
    setWalls([...updatedWalls, ...newWalls]);
    setLastAddedNode(newNode);
    setSelectedNode(newNode);
  };

  const deleteNode = (event) => {
    saveStateToHistory();
    if (!canvasRef.current) return;
  
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
  
    // Get the mouse position in grid coordinates
    const x = Math.round((event.clientX - rect.left - centerX - offset.x) / zoom);
    const y = Math.round((event.clientY - rect.top - centerY - offset.y) / zoom);
  
    // Snap the deleted node to the grid
    const snappedPos = snapToGrid(x, y);
  
    // Filter out the node that was clicked on
    setNodes((prevNodes) => {
      const threshold = 5; // Increased threshold for node deletion (tune this value)
      return prevNodes.filter(node => {
        const distance = Math.sqrt((node.x - snappedPos.x) ** 2 + (node.y - snappedPos.y) ** 2);
        return distance > threshold;  // Allows for some margin for error in node position
      });
    });
  
    // Remove walls related to the deleted node
    setWalls((prevWalls) => {
      return prevWalls.filter(([startNode, endNode]) => {
        // Increase the threshold slightly to ensure the walls are properly matched
        const isStartNodeMatched = Math.abs(startNode.x - snappedPos.x) < 2 && Math.abs(startNode.y - snappedPos.y) < 2;
        const isEndNodeMatched = Math.abs(endNode.x - snappedPos.x) < 2 && Math.abs(endNode.y - snappedPos.y) < 2;
  
        return !(isStartNodeMatched || isEndNodeMatched); // Only keep walls that don't match the deleted node
      });
    });
  };

  const startPan = (event) => {
    setIsDragging(true);
    dragStart.current = { x: event.clientX, y: event.clientY };

    const canvas = document.querySelector('.grid-canvas');
    canvas.style.cursor = "grabbing";
  };

  function distanceToSegment(p, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    if (dx === 0 && dy === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
    const projX = a.x + t * dx;
    const projY = a.y + t * dy;
    return Math.hypot(p.x - projX, p.y - projY);
  }

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    clearSelected();
    setRedoStack((r) => [...r, { nodes, walls }]);
    setHistory((h) => h.slice(0, h.length - 1));
    setNodes(last.nodes);
    setWalls(last.walls);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    clearSelected();
    setHistory((h) => [...h, { nodes, walls }]);
    setRedoStack((r) => r.slice(0, r.length - 1));
    setNodes(last.nodes);
    setWalls(last.walls);
  };

  function getNodeAtPoint(x, y, nodes) {
    const threshold = 8;
    for (const node of nodes) {
      const dist = Math.hypot(node.x - x, node.y - y);
      if (dist <= threshold) return node;
    }
    return null;
  }
  
  function getWallAtPoint(x, y, walls) {
    const threshold = 2;
  
    for (let i = 0; i < walls.length; i++) {
      const wall = walls[i];
      const a = wall[0];
      const b = wall[1];
  
      const dist = distanceToSegment({ x, y }, a, b);
      if (dist < threshold) return wall;
    }
  
    return null;
  }

  const startSelect = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
  
    const x = (event.clientX - rect.left - centerX - offset.x) / zoom;
    const y = (event.clientY - rect.top - centerY - offset.y) / zoom;
  
    const clickedNode = getNodeAtPoint(x, y, nodes);
    console.log("Clicked node:", clickedNode);

    const clickedWall = getWallAtPoint(x, y, walls);
    console.log("Clicked wall:", clickedWall);
    
    clearSelected();
    setSelectedNode(null); // Ensure the node sidebar doesn't trigger
    
    // Check if clicking on an AP
    const ap = accessPoints.find(ap => {
      const dist = Math.hypot(ap.x - x, ap.y - y);
      return dist < 10;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      return;
    }
    else if (clickedWall) {
      setSelectedWall(clickedWall);
      return;
    }
    else if (ap) {
      setSelectedAP(ap);
      if (onSelectAP) onSelectAP();
      return;
    }
  };

  const handlePan = (event) => {
    if (!isDragging) return;

    setOffset({
      x: offset.x + (event.clientX - dragStart.current.x),
      y: offset.y + (event.clientY - dragStart.current.y),
    });

    dragStart.current = { x: event.clientX, y: event.clientY };
  };

  const stopPan = () => {
    const canvas = document.querySelector('.grid-canvas');
    canvas.style.cursor = "pointer";
    setIsDragging(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        clearSelected();
      }
      else if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        handleUndo();
      } else if (e.ctrlKey && (e.key === "y" || (e.shiftKey && e.key === "Z"))) {
        e.preventDefault();
        handleRedo();
    } else if (e.key === "Backspace") {
      e.preventDefault();
      if (selectedNode) {
        saveStateToHistory();
      
        setNodes((prevNodes) => {
          const threshold = 5;
          return prevNodes.filter(node => {
            const distance = Math.sqrt((node.x - selectedNode.x) ** 2 + (node.y - selectedNode.y) ** 2);
            return distance > threshold;
          });
        });
      
        setWalls((prevWalls) => {
          return prevWalls.filter(([startNode, endNode]) => {
            const isStartNodeMatched = Math.abs(startNode.x - selectedNode.x) < 2 && Math.abs(startNode.y - selectedNode.y) < 2;
            const isEndNodeMatched = Math.abs(endNode.x - selectedNode.x) < 2 && Math.abs(endNode.y - selectedNode.y) < 2;
            return !(isStartNodeMatched || isEndNodeMatched);
          });
        });
      
        setSelectedNode(null);
      } else if (selectedWall) {
        setWalls(prev => prev.filter(w => w !== selectedWall));
        setSelectedWall(null);
      }
    }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNode, selectedWall, nodes, walls, history, redoStack]);

  const centerGrid = () => {
    const newCenterX = window.innerWidth / 2;
    const newCenterY = window.innerHeight / 2;
  
    setOffset({
      x: -newCenterX,
      y: -newCenterY,
    });
  };  

  const handleDoubleClick = () => {
    centerGrid();
  };

  return (
    <div className="workspace">
      {/* Grid */}
      <div
        className="canvas-container"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={stopPan}
        onMouseLeave={stopPan}
        onDoubleClick={handleDoubleClick}
      >
        <canvas ref={canvasRef} className="grid-canvas" onContextMenu={(e) => e.preventDefault()}></canvas>
      </div>

      {/* 🔥 Floating Toggle Grid Button (Dynamically Moves with Sidebar) */}
      <button
        className="toggle-grid-button"
        onClick={toggleGrid}
      >
        {showGrid ? "Hide Grid" : "Show Grid"}
      </button>
      
      <div className="bottomContainer">
        <div className="cursor-position">
          X: {cursorPos.x}, Y: {cursorPos.y}
        </div>

        <div className="cursor-position">
          Room Counter: {roomShapes.length}
        </div>
      </div>
    </div>
  );
};

export default CanvasGrid;
