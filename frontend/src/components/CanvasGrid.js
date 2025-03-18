import React, { useRef, useEffect, useState } from "react";
import "../styles/Workspace.css";

const CanvasGrid = ({ isSidebarOpen, sidebarWidth = 300, isAddingNode, isDeletingNode }) => {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [nodes, setNodes] = useState([]);
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
  }, [zoom, offset, showGrid, nodes]);

  const toggleGrid = () => {
    setShowGrid((prev) => !prev);
  };

  const handleMouseMove = (event) => {
    handlePan(event);
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const x = ((event.clientX - centerX - offset.x) / zoom).toFixed(1);
    const y = ((event.clientY - centerY - offset.y) / zoom).toFixed(1);

    setCursorPos({ x, y });
  };

  const handleMouseDown = (event) => {
    if (event.button !== 0) return; // Left click only
  
    if (isAddingNode) {
      addNode(event);
    } 
    else if (isDeletingNode) {
      deleteNode(event);
    }
    else {
      // ✅ Otherwise, start panning
      startPan(event);
    }
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

  const handleDoubleClick = () => {
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

  const handleZoom = (event) => {
    event.preventDefault();

    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1; // 🔄 Zoom In or Out
    const newZoom = Math.max(0.2, Math.min(zoom * zoomFactor, 5)); // 🔥 Limit zoom levels
    setZoom(newZoom);
  }; 

  // 🔹 Function to add a node at cursor position
  const addNode = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const x = Math.round((event.clientX - centerX - offset.x) / zoom);
    const y = Math.round((event.clientY - centerY - offset.y) / zoom);

    setNodes((prevNodes) => [...prevNodes, { x, y }]);
  };

  // 🔹 Function to add a node at cursor position
  const deleteNode = (event: MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const x = Math.round((event.clientX - centerX - offset.x) / zoom);
    const y = Math.round((event.clientY - centerY - offset.y) / zoom);

    setNodes((prevNodes) => {
        // Find the closest node to the click
        const threshold = 10; // Adjust as needed for click accuracy
        const filteredNodes = prevNodes.filter(node => {
            const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
            return distance > threshold;
        });

        return filteredNodes;
    });
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
