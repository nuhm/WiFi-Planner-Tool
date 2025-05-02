import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { detectRooms } from './RoomDetection';
import {
  ALLOWED_ANGLES,
  AP_DISTANCE_THRESHOLD,
  BASE_GRID_SIZE,
  MAX_HISTORY_LENGTH,
  NODE_DISTANCE_THRESHOLD,
  SELECTED_COLOR,
  SIGNAL_STYLES,
  WALL_MATCH_THRESHOLD,
  ZOOM_MAX,
  ZOOM_MIN
} from '../constants/config';
import {
  distanceToSegment,
  getLineIntersection,
  getOrCreateNode,
  getSnappedCursorPos,
  snapToGrid,
  trySplitWallAtClick,
  trySplitWallWithLine
} from '../helpers/gridUtils';
import "../styles/Workspace.css";
import { useToast } from './toast/ToastContext';
import { createGrid } from "./grid/createGrid";
import { drawPreview } from "./grid/drawPreview";

const Canvas = ({
  mode, nodes, setNodes, walls, setWalls, lastAddedNode, setLastAddedNode, openConfigSidebar, accessPoints, setAccessPoints
}) => {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(10);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showRooms, setShowRooms] = useState(true);
  const [showCoverage, setShowCoverage] = useState(true);
  const [showUnits, setShowUnits] = useState(true);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [preview, setPreview] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isValidPreview, setIsValidPreview] = useState(true);
  const roomColorsRef = useRef({});
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [roomShapes, setRoomShapes] = useState([]);
  const [heatmapTiles, setHeatmapTiles] = useState([]);
  const [selected, setSelected] = useState({
    node: null,
    wall: null,
    ap: null,
  });

  const { showToast } = useToast();
  const gridSizes = {
    base: BASE_GRID_SIZE,
    main: BASE_GRID_SIZE * zoom,
    sub: (BASE_GRID_SIZE * zoom) / 5,
    subSub: (BASE_GRID_SIZE * zoom) / 10,
  };
  
  /**
   * Saves the current state of nodes and walls to the history stack for undo functionality.
   */
  const saveStateToHistory = () => {
    const state = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      walls: JSON.parse(JSON.stringify(walls)),
    };
    setHistory((prev) => [...prev.slice(-MAX_HISTORY_LENGTH + 1), state]);
    setRedoStack([]); // Clear redo stack on new change
  };

  const dragStart = useRef({ x: 0, y: 0 });

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
    const filtered = allRooms.filter(room => getPolygonArea(room) >= 10);
    setRoomShapes(filtered);
  }, [walls]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

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
          roomColorsRef[key] = `hsla(${hue}, 80%, 60%, 0.25)`;
          nextHue++;
        }

        ctx.fillStyle = roomColorsRef[key];
        ctx.fill();
      });
    }
    
    // WiFi Signal Heatmap Rendering
    const maxRange = 50; // in world units
    const gridStep = gridSizes.base / 10;
    if (showCoverage) {
      const signalToColor = (dbm) => {
        if (dbm > -50) return SIGNAL_STYLES.excellent;
        if (dbm > -70) return SIGNAL_STYLES.good;
        if (dbm > -85) return SIGNAL_STYLES.fair;
        return SIGNAL_STYLES.poor;
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
      });
    }
    
    // **Draw Walls (Lines between nodes)**
    walls.forEach((wall) => {
      const { a: startNode, b: endNode } = wall;
      const dx = endNode.x - startNode.x;
      const dy = endNode.y - startNode.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length === 0) {
        console.log("⚠️ Zero-length wall detected:", startNode, endNode);
      }

      const startX = centerX + startNode.x * zoom;
      const startY = centerY + startNode.y * zoom;
      const endX = centerX + endNode.x * zoom;
      const endY = centerY + endNode.y * zoom;
    
      ctx.lineWidth = 6;

      if (selected.wall && wall.id === selected.wall.id) {
        ctx.strokeStyle = SELECTED_COLOR;
      } else {
        ctx.strokeStyle = "#777";
      }
    
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
        ctx.font = `${1 * zoom}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillStyle = "#fff";
        ctx.fillText(`${displayLength}m`, 0, -5);
        ctx.restore();
      }
    });

    // **Draw Nodes**
    ctx.fillStyle = "#888";
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
        ctx.font = `${1 * zoom}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
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

    drawPreview(preview, ctx, zoom, centerX, centerY, isValidPreview, selected.node, mode.isAddingNode);

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

  }, [zoom, offset, showGrid, showRooms, showCoverage, showUnits, nodes, preview, walls, selected, accessPoints, roomShapes, mode.isAddingNode]);

  useEffect(() => {
    if (!showCoverage) return;

    const timeout = setTimeout(() => {
      const tiles = [];

      const d0 = 1;
      const pl0 = 30;
      const n = 2.2;
      const txPower = 10;
      const maxRange = 50;
      const gridStep = gridSizes.base / 10;

      const obstructionCache = new Map();
      const makeKey = (apX, apY, gx, gy) => `${apX.toFixed(1)}:${apY.toFixed(1)}:${gx.toFixed(1)},${gy.toFixed(1)}`;

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

            const key = makeKey(ap.x, ap.y, worldX, worldY);
            let obstructed = false;

            if (obstructionCache.has(key)) {
              obstructed = obstructionCache.get(key);
            } else {
              obstructed = walls.some(({ a, b }) =>
                getLineIntersection({ x: ap.x, y: ap.y }, { x: worldX, y: worldY }, a, b)
              );
              obstructionCache.set(key, obstructed);
            }

            if (obstructed) continue;

            const pathLoss = pl0 + 10 * n * Math.log10(dist / d0);
            const signal = txPower - pathLoss;

            if (signal > -90) {
              tiles.push({ x: worldX, y: worldY, signal });
            }
          }
        }
      });

      setHeatmapTiles(tiles);
    }, 10);

    return () => clearTimeout(timeout);
  }, [walls, accessPoints, showCoverage]);

  useEffect(() => {
    if (!isLoaded) {
      setIsLoaded(true);
      centerGrid();
    }
  }, [isLoaded]);

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
  
    return ALLOWED_ANGLES.some(a => Math.abs(absAngle - a) < epsilon);
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

  const lastUpdate = useRef(Date.now());
  /**
   * Handles mouse movement over the canvas, including panning, updating the cursor position,
   * and updating the preview for node or access point placement.
   * @param {MouseEvent} event - The mouse move event.
   */
  const handleMouseMove = (event) => {
    const now = Date.now();
    if (now - lastUpdate.current < 16) return; // Limit to 60fps
    lastUpdate.current = now;

    handlePan(event);
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Convert mouse position to grid-based position
    const x = (event.clientX - rect.left - centerX - offset.x) / zoom;
    const y = (event.clientY - rect.top - centerY - offset.y) / zoom;

    // Snap position
    const snappedPos = snapToGrid(x, y);
    setCursorPos(snappedPos);

    // Update preview node or access point
    if (mode.isAddingNode) {
      setPreview({ type: 'node', position: snappedPos });
    
      if (lastAddedNode) {
        const dx = snappedPos.x - lastAddedNode.x;
        const dy = snappedPos.y - lastAddedNode.y;
        setIsValidPreview(isAllowedAngle(dx, dy));
      } else {
        setIsValidPreview(true); // No constraint if no previous node
      }
    } else if (mode.isPlacingAP) {
      setPreview({ type: 'ap', position: snappedPos });
    } else {
      setPreview(null);
    }
  };

  /**
   * Handles mouse down events on the canvas, including adding or deleting nodes or access points,
   * initiating panning, and selecting elements.
   * @param {MouseEvent} event - The mouse down event.
   */
  const handleMouseDown = (event) => {
    clearSelected();

    if (mode.isPlacingAP) {
      if (event.button === 0) {
        addAP(event);
      }
      if (event.button === 2) {
        deleteAP(event);
      }
    }

    if (event.button === 1 || mode.isPanning) {
      startPan(event);
      return;
    }

    if (mode.isSelecting) {
      startSelect(event);
      return;
    }

    if (mode.isTestingSignal) {
      console.log("Testing signal...");
      return;
    }

    if (mode.isAddingNode && event.shiftKey) {
      deleteNode(event);
    } else if (mode.isAddingNode) {
      addNode(event);
    }
  };

  /**
   * Adds a node at the cursor position, splitting walls if necessary and validating angles.
   * @param {MouseEvent} event - The mouse event object.
   */
  const addNode = (event) => {
    saveStateToHistory();
    const snappedPos = getSnappedCursorPos(event, canvasRef, offset, zoom, snapToGrid, setCursorPos);

    // Try to split wall at click if no lastAddedNode
    if (!lastAddedNode) {
      const splitResult = trySplitWallAtClick(snappedPos, nodes, walls, snapToGrid);
      if (splitResult) {
        setNodes(splitResult.nodes);
        setWalls(splitResult.walls);
        setLastAddedNode(splitResult.node);
        setSelected({ node: splitResult.node, wall: null, ap: null });
        return;
      }
    }

    // Try to split wall with a line from lastAddedNode to snappedPos
    let updatedNodes = [...nodes];
    let updatedWalls = [...walls];
    let newNode = null;
    let splitOccurred = false;
    if (lastAddedNode) {
      const splitResult = trySplitWallWithLine(lastAddedNode, snappedPos, updatedNodes, updatedWalls, snapToGrid);
      if (splitResult) {
        updatedNodes = splitResult.nodes;
        updatedWalls = splitResult.walls;
        newNode = splitResult.node;
        splitOccurred = true;
      }
    }

    // Angle validation if needed and no wall split occurred
    if (lastAddedNode && !splitOccurred) {
      const dx = snappedPos.x - lastAddedNode.x;
      const dy = snappedPos.y - lastAddedNode.y;
      if (!isAllowedAngle(dx, dy)) {
        showToast('Node must be placed at 45° or 90° angle.');
        return;
      }
    }

    // Create or reuse node at the clicked position if needed
    if (!newNode) {
      newNode = getOrCreateNode(snappedPos, updatedNodes);
    }

    // Wall creation if appropriate and no wall split
    let newWalls = [];
    if (lastAddedNode && !splitOccurred) {
      // Prevent linking same node to itself
      if (newNode.x === lastAddedNode.x && newNode.y === lastAddedNode.y) {
        clearSelected();
        return;
      }
      newWalls.push({
        id: uuidv4(),
        a: lastAddedNode,
        b: newNode,
        config: { material: 'drywall', thickness: 10 }
      });
    }

    setNodes(updatedNodes);
    setWalls([...updatedWalls, ...newWalls]);
    setLastAddedNode(newNode);
    setSelected({ node: newNode, wall: null, ap: null });
  };

  /**
   * Deletes a node at the cursor position and removes related walls.
   * @param {MouseEvent} event - The mouse event object.
   */
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
      return prevNodes.filter(node => {
        const distance = Math.sqrt((node.x - snappedPos.x) ** 2 + (node.y - snappedPos.y) ** 2);
        return distance > NODE_DISTANCE_THRESHOLD;  // Allows for some margin for error in node position
      });
    });
  
    // Remove walls related to the deleted node
    setWalls((prevWalls) => {
      return prevWalls.filter(({ a: startNode, b: endNode }) => {
        // Define match threshold for node-wall matching
        const isStartNodeMatched = Math.abs(startNode.x - snappedPos.x) < WALL_MATCH_THRESHOLD && Math.abs(startNode.y - snappedPos.y) < WALL_MATCH_THRESHOLD;
        const isEndNodeMatched = Math.abs(endNode.x - snappedPos.x) < WALL_MATCH_THRESHOLD && Math.abs(endNode.y - snappedPos.y) < WALL_MATCH_THRESHOLD;

        return !(isStartNodeMatched || isEndNodeMatched); // Only keep walls that don't match the deleted node
      });
    });
  };

  /**
   * Adds an access point at the cursor position.
   * @param {MouseEvent} event - The mouse event object.
   */
  const addAP = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const x = (event.clientX - rect.left - centerX - offset.x) / zoom;
    const y = (event.clientY - rect.top - centerY - offset.y) / zoom;

    const snapped = snapToGrid(x, y);

    setAccessPoints(prev => {
      const newName = `Access Point #${prev.length + 1}`;
      return [...prev, { 
        id: uuidv4(), 
        x: snapped.x, 
        y: snapped.y, 
        name: newName 
      }];
    });

    return;
  }

  /**
   * Deletes an access point at the cursor position.
   * @param {MouseEvent} event - The mouse event object.
   */
  const deleteAP = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const x = (event.clientX - rect.left - centerX - offset.x) / zoom;
    const y = (event.clientY - rect.top - centerY - offset.y) / zoom;

    const snapped = snapToGrid(x, y);

    setAccessPoints(prev => prev.filter(ap => {
      const dist = Math.hypot(ap.x - snapped.x, ap.y - snapped.y);
      return dist > AP_DISTANCE_THRESHOLD;
    }));
  }

  /**
   * Starts the panning operation for the canvas.
   * @param {MouseEvent} event - The mouse event object.
   */
  const startPan = (event) => {
    setIsDragging(true);
    dragStart.current = { x: event.clientX, y: event.clientY };

    const canvas = document.querySelector('.grid-canvas');
    canvas.style.cursor = "grabbing";
  };

  

  /**
   * Undoes the last action by restoring the previous state from history.
   */
  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    clearSelected();
    setRedoStack((r) => [...r, { nodes, walls }]);
    setHistory((h) => h.slice(0, h.length - 1));
    setNodes(last.nodes);
    setWalls(last.walls);
  };

  /**
   * Redoes the last undone action by restoring the state from the redo stack.
   */
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    clearSelected();
    setHistory((h) => [...h, { nodes, walls }]);
    setRedoStack((r) => r.slice(0, r.length - 1));
    setNodes(last.nodes);
    setWalls(last.walls);
  };

  /**
   * Returns the node at the given coordinates if found within the threshold.
   * @param {number} x - X coordinate.
   * @param {number} y - Y coordinate.
   * @param {Array} nodes - Array of nodes.
   * @returns {object|null} The found node or null.
   */
  function getNodeAtPoint(x, y, nodes) {
    for (const node of nodes) {
      const dist = Math.hypot(node.x - x, node.y - y);
      if (dist <= NODE_DISTANCE_THRESHOLD) return { ...node };
    }
    return null;
  }
  
  /**
   * Returns the wall at the given coordinates if found within the threshold.
   * @param {number} x - X coordinate.
   * @param {number} y - Y coordinate.
   * @param {Array} walls - Array of walls.
   * @returns {object|null} The found wall or null.
   */
  function getWallAtPoint(x, y, walls) {
    for (let i = 0; i < walls.length; i++) {
      const wall = walls[i];
      const { a, b } = wall;
  
      const dist = distanceToSegment({ x, y }, a, b);
      if (dist < WALL_MATCH_THRESHOLD) return wall;
    }
  
    return null;
  }

  /**
   * Returns the access point at the given coordinates if found within the threshold.
   * @param {number} x - X coordinate.
   * @param {number} y - Y coordinate.
   * @param {Array} accessPoints - Array of access points.
   * @returns {object|null} The found access point or null.
   */
  function getAPAtPoint(x, y, accessPoints) {
    for (const ap of accessPoints) {
      const dist = Math.hypot(ap.x - x, ap.y - y);
      if (dist <= AP_DISTANCE_THRESHOLD) return ap;
    }
    return null;
  }

  /**
   * Handles selection of nodes, walls, or access points based on the cursor position.
   * @param {MouseEvent} event - The mouse event object.
   */
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

    const clickedAP = getAPAtPoint(x, y, accessPoints);
    console.log("Clicked AP:", clickedAP);

    if (clickedNode) {
      setSelected({ node: clickedNode, wall: null, ap: null });
      openConfigSidebar();
      return;
    }
    else if (clickedWall) {
      setSelected({ node: null, wall: clickedWall, ap: null });
      openConfigSidebar();
      return;
    }
    else if (clickedAP) {
      setSelected({ node: null, wall: null, ap: clickedAP });
      openConfigSidebar();
      return;
    }
    else {
      clearSelected();
    }
  };

  /**
   * Handles the panning of the canvas during drag operations.
   * @param {MouseEvent} event - The mouse move event.
   */
  const handlePan = (event) => {
    if (!isDragging) return;

    setOffset({
      x: offset.x + (event.clientX - dragStart.current.x),
      y: offset.y + (event.clientY - dragStart.current.y),
    });

    dragStart.current = { x: event.clientX, y: event.clientY };
  };

  /**
   * Stops the panning operation and resets the cursor.
   */
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
      } else if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        handleUndo();
      } else if (e.ctrlKey && (e.key === "y" || (e.shiftKey && e.key === "Z"))) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        saveStateToHistory();

        if (selected.node) {
          const nodeId = selected.node.id;
          setNodes(prevNodes => prevNodes.filter(node => node.id !== nodeId));
          setWalls(prevWalls => prevWalls.filter(({ a, b }) => {
            const matchesA = a.id === nodeId || (a.x === selected.node.x && a.y === selected.node.y);
            const matchesB = b.id === nodeId || (b.x === selected.node.x && b.y === selected.node.y);
            return !matchesA && !matchesB;
          }));
          setSelected({ node: null, wall: null, ap: null });
        } else if (selected.wall) {
          setWalls(prev => prev.filter(w => w.id !== selected.wall.id));
          setSelected({ node: null, wall: null, ap: null });
        } else if (selected.ap) {
          setAccessPoints(prevAps => prevAps.filter(ap => ap.id !== selected.ap.id));
          setSelected({ node: null, wall: null, ap: null });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected, nodes, walls, history, redoStack]);

  /**
   * Centers the grid on the screen by updating the offset state.
   */
  const centerGrid = () => {
    const newCenterX = window.innerWidth / 2;
    const newCenterY = window.innerHeight / 2;
  
    setOffset({
      x: -newCenterX,
      y: -newCenterY,
    });
  };  

  /**
   * Handles double click events to center the grid.
   */
  const handleDoubleClick = () => {
    centerGrid();
  };

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
        <canvas ref={canvasRef} className="grid-canvas" onContextMenu={(e) => e.preventDefault()}></canvas>
      </div>

      <div className="canvas-toggle-buttons">
        <button className="canvas-overlay-button" onClick={toggleGrid}>
          {showGrid ? "Hide Grid" : "Show Grid"}
        </button>

        <button className="canvas-overlay-button" onClick={toggleRooms}>
          {showRooms ? "Hide Rooms" : "Show Rooms"}
        </button>

        <button className="canvas-overlay-button" onClick={toggleCoverage}>
          {showCoverage ? "Hide Coverage" : "Show Coverage"}
        </button>

        <button className="canvas-overlay-button" onClick={toggleUnits}>
          {showUnits ? "Hide Units" : "Show Units"}
        </button>
      </div>

      <div className="upperBottomContainer">
          <button className="canvas-overlay-button" onClick={handleUndo}>Undo</button>
          <button className="canvas-overlay-button" onClick={handleRedo}>Redo</button>
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