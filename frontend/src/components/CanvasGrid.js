import React, { useRef, useEffect, useState } from "react";
import "../styles/Workspace.css";

const CanvasGrid = () => {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showGrid, setShowGrid] = useState(true); // 🔥 Grid visibility state
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const baseGridSize = 50;
    const gridSize = baseGridSize * zoom;
    const subGridSize = gridSize / 5; // 🔥 Sub-grid (smaller squares inside big squares)

    canvas.width = window.innerWidth * 2;
    canvas.height = window.innerHeight * 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showGrid) { // 🔥 Only draw grid if showGrid is true
      const alignedOffsetX = -Math.round(offset.x % gridSize);
      const alignedOffsetY = -Math.round(offset.y % gridSize);

      // **Draw Sub-Grid (Only if zoomed in)**
      if (zoom > 0.5) {
        ctx.strokeStyle = "#e0e0e0";
        ctx.lineWidth = 0.5;
        for (let x = alignedOffsetX; x < canvas.width; x += subGridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = alignedOffsetY; y < canvas.height; y += subGridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }

      // **Draw Main Grid**
      ctx.strokeStyle = "#ccc";
      ctx.lineWidth = 1;
      for (let x = alignedOffsetX; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = alignedOffsetY; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }
  }, [zoom, offset, showGrid]); // 🔥 Reacts to showGrid state

  const toggleGrid = () => {
    setShowGrid(!showGrid);
  };

  return (
    <div className="workspace">
      {/* Grid */}
      <div
        className="canvas-container"
        onWheel={(e) => setZoom(Math.max(0.5, Math.min(zoom * (e.deltaY > 0 ? 0.9 : 1.1), 5)))}
        onMouseDown={(e) => {
          setIsDragging(true);
          dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
        }}
        onMouseMove={(e) => {
          if (isDragging) {
            setOffset({ x: offset.x - (e.clientX - dragStart.current.x), y: offset.y - (e.clientY - dragStart.current.y) });
            dragStart.current = { x: e.clientX, y: e.clientY };
          }
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        <canvas ref={canvasRef} className="grid-canvas"></canvas>
  
        {/* Floating Toggle Grid Button */}
        <button className="toggle-grid-button" onClick={toggleGrid}>
          {showGrid ? "Hide Grid" : "Show Grid"}
        </button>
      </div>
    </div>
  );  
};

export default CanvasGrid;
