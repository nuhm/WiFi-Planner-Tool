import React, { useRef, useEffect, useState } from "react";
import "../styles/Workspace.css";

const CanvasGrid = ({ isSidebarOpen, sidebarWidth = 300, isPanning, isAddingNode, isDeletingNode, isWallBuilder, nodes, setNodes, walls, setWalls, projectName }) => {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [previewNode, setPreviewNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const dragStart = useRef({ x: 0, y: 0 });

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
      if (zoom > 0.5) {
        ctx.strokeStyle = "#e0e0e0";
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

      // **Draw Main Grid**
      ctx.strokeStyle = "#ccc";
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
    }

    // **Draw Center Crosshair (Always Visible)**
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();

    // **Draw Nodes**
    ctx.fillStyle = "red";
    nodes.forEach(({ x, y }) => {
      ctx.beginPath();
      ctx.arc(centerX + x * zoom, centerY + y * zoom, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // **Draw Preview Node (Ghost)**
    if (previewNode) {
      ctx.fillStyle = "rgba(255, 0, 0, 0.5)"; // Semi-transparent red
      ctx.beginPath();
      ctx.arc(centerX + previewNode.x * zoom, centerY + previewNode.y * zoom, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // **Draw Walls (Lines between nodes)**
    ctx.strokeStyle = "blue"; // Color of walls
    ctx.lineWidth = 5;
    walls.forEach(([startNode, endNode]) => {
      const startX = centerX + startNode.x * zoom;
      const startY = centerY + startNode.y * zoom;
      const endX = centerX + endNode.x * zoom;
      const endY = centerY + endNode.y * zoom;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    });

  }, [zoom, offset, showGrid, nodes, previewNode, walls]);

  useEffect(() => {
    if (!isLoaded) {
      setIsLoaded(!isLoaded);
      centerGrid();
    }
  }, [isLoaded]);

  const toggleGrid = () => {
    setShowGrid((prev) => !prev);
  };

  const snapToGrid = (x, y) => {
    const baseGridSize = 50; 
    return {
      x: Math.round(x / baseGridSize) * baseGridSize,
      y: Math.round(y / baseGridSize) * baseGridSize
    };
  };

  const handleMouseMove = (event) => {
    handlePan(event);
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // **Convert mouse position to grid-based position**
    const x = (event.clientX - centerX - offset.x) / zoom;
    const y = (event.clientY - centerY - offset.y) / zoom;

    // **Snap position**
    const snappedPos = snapToGrid(x, y);
    setCursorPos(snappedPos);

    // **Update preview node**
    if (isAddingNode) {
      setPreviewNode(snappedPos);
    } else {
      setPreviewNode(null);
    }
  };

  const handleMouseDown = (event) => {
    if (event.button !== 0) return; // Left click only

    if (isPanning) {
      startPan(event);
      return;
    }
  
    if (isWallBuilder) {
      if (selectedNode) {
        // Check if the clicked node is an existing node
        const clickedNode = nodes.find(node => node.x === cursorPos.x && node.y === cursorPos.y);
        if (clickedNode) {
          // If clicked node is valid, link it to the selected node
          linkNodes(selectedNode, clickedNode);
          setSelectedNode(null); // Reset selection after linking
        }
      } else {
        // Select the first node for linking
        const clickedNode = nodes.find(node => node.x === cursorPos.x && node.y === cursorPos.y);
        if (clickedNode) {
          setSelectedNode(clickedNode); // Set the first selected node
        }
      }
    } else if (isAddingNode) {
      addNode(event);
    } else if (isDeletingNode) {
      deleteNode(event);
    }
  };

  // 🔹 Function to add a node at cursor position
  const addNode = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // **Snap to grid before adding node**
    const x = (event.clientX - centerX - offset.x) / zoom;
    const y = (event.clientY - centerY - offset.y) / zoom;

    const snappedPos = snapToGrid(x, y);
    setCursorPos(snappedPos);

    setNodes((prevNodes) => [...prevNodes, snappedPos]);
  };

  const deleteNode = (event) => {
    if (!canvasRef.current) return;
  
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
  
    const x = Math.round((event.clientX - centerX - offset.x) / zoom);
    const y = Math.round((event.clientY - centerY - offset.y) / zoom);
  
    setNodes((prevNodes) => {
      const threshold = 10;
      return prevNodes.filter(node => {
        const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
        return distance > threshold;
      });
    });

    // Remove walls related to deleted nodes
    setWalls((prevWalls) => prevWalls.filter(([startNode, endNode]) => {
      return !(startNode.x === x && startNode.y === y) && !(endNode.x === x && endNode.y === y);
    }));
  };

   // 🔹 Function to link two nodes (make a wall)
  const linkNodes = (node1, node2) => {
    setWalls((prevWalls) => [...prevWalls, [node1, node2]]);
  };

  const startPan = (event) => {
    setIsDragging(true);
    dragStart.current = { x: event.clientX, y: event.clientY };
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
    setIsDragging(false);
  };

  const centerGrid = () => {
    const canvasArea = document.querySelector(".canvas-area"); // Get the visible canvas area
    const sidebar = document.querySelector(".sidebar"); // Get the sidebar
  
    if (!canvasArea) return;
  
    const rect = canvasArea.getBoundingClientRect(); // Get canvas dimensions
    const sidebarWidth = sidebar ? sidebar.getBoundingClientRect().width : 0; // Get sidebar width
  
    // Calculate the new center, ignoring the sidebar width
    const newCenterX = rect.width / 2 + sidebarWidth;
    const newCenterY = rect.height / 2;
  
    // Move (0,0) to the center of the visible canvas area (excluding sidebar)
    setOffset({
      x: -newCenterX,
      y: -newCenterY,
    });
  };

  const handleDoubleClick = () => {
    centerGrid();
  };

  const handleZoom = (event) => {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    setZoom(Math.max(0.2, Math.min(zoom * zoomFactor, 5)));
  };

  return (
    <div className="workspace">
      {/* Grid */}
      <div
        className="canvas-container"
        onWheel={handleZoom}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={stopPan}
        onMouseLeave={stopPan}
        onDoubleClick={handleDoubleClick}
      >
        <canvas ref={canvasRef} className="grid-canvas"></canvas>

        {/* 🔥 Floating Toggle Grid Button (Dynamically Moves with Sidebar) */}
        <button
          className="toggle-grid-button"
          style={{
            right: isSidebarOpen ? `${sidebarWidth + 20}px` : "20px",
            transition: "right 0.3s ease",
          }}
          onClick={toggleGrid}
        >
          {showGrid ? "Hide Grid" : "Show Grid"}
        </button>

        {/* 🔥 Cursor Position Display */}
        <div className="cursor-position">
          X: {cursorPos.x}, Y: {cursorPos.y}
        </div>
      </div>
    </div>
  );
};

export default CanvasGrid;
