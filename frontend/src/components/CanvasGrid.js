import React, { useRef, useEffect, useState } from "react";
import "../styles/Workspace.css";

const CanvasGrid = () => {
  const canvasRef = useRef(null);
  const rulerXRef = useRef(null);
  const rulerYRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
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
  
    // **Reverse the movement so rulers go in the correct direction**
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
  
    updateRulers(gridSize, offset);
  }, [zoom, offset]);
  

  const updateRulers = (gridSize, offset) => {
    const rulerX = rulerXRef.current;
    const rulerY = rulerYRef.current;
    if (!rulerX || !rulerY) return;
  
    rulerX.innerHTML = "";
    rulerY.innerHTML = "";
  
    const possibleSteps = [5, 10, 20, 50, 100, 200, 500, 1000];
    let labelStep = possibleSteps.find((s) => gridSize * s >= 100) || 1000;
  
    // **Fix Ruler Offset When Zooming**
    const alignedOffsetX = -Math.round(offset.x % gridSize);
    const alignedOffsetY = -Math.round(offset.y % gridSize);
  
    // **Top Ruler (X-Axis)**
    for (let i = alignedOffsetX + 20; i < window.innerWidth; i += gridSize) {
      const labelValue = Math.round((i + offset.x - 20) / gridSize) * labelStep;
  
      const tick = document.createElement("div");
      tick.className = "ruler-tick";
      tick.style.left = `${i}px`;
      tick.style.height = labelValue % (labelStep * 2) === 0 ? "10px" : labelValue % labelStep === 0 ? "7px" : "4px";
      rulerX.appendChild(tick);
  
      if (labelValue % labelStep === 0) {
        const mark = document.createElement("div");
        mark.className = "ruler-mark";
        mark.style.left = `${i}px`;
        mark.innerText = `${labelValue}`;
        rulerX.appendChild(mark);
      }
    }
  
    // **Left Ruler (Y-Axis)**
    for (let i = alignedOffsetY + 20; i < window.innerHeight; i += gridSize) {
      const labelValue = Math.round((i + offset.y - 20) / gridSize) * labelStep;
  
      const tick = document.createElement("div");
      tick.className = "ruler-tick";
      tick.style.top = `${i}px`;
      tick.style.width = labelValue % (labelStep * 2) === 0 ? "10px" : labelValue % labelStep === 0 ? "7px" : "4px";
      rulerY.appendChild(tick);
  
      if (labelValue % labelStep === 0) {
        const mark = document.createElement("div");
        mark.className = "ruler-mark";
        mark.style.top = `${i}px`;
        mark.innerText = `${labelValue}`;
        rulerY.appendChild(mark);
      }
    }
  };
  

  const handleZoom = (event) => {
    event.preventDefault();
  
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(zoom * zoomFactor, 5)); // 🔥 Set limits
  
    // **Fix zoom origin so the grid scales correctly**
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
  
    // Adjust offset so zoom happens around cursor position
    setOffset({
      x: (mouseX - offset.x) * (newZoom / zoom) + offset.x,
      y: (mouseY - offset.y) * (newZoom / zoom) + offset.y,
    });
  
    setZoom(newZoom);
  };
  

  const startPan = (event) => {
    setIsDragging(true);
    dragStart.current = { x: event.clientX - offset.x, y: event.clientY - offset.y };
  };

  const handlePan = (event) => {
    if (!isDragging) return;
  
    // **Reverse movement direction for correct panning**
    setOffset({
      x: offset.x - (event.clientX - dragStart.current.x),
      y: offset.y - (event.clientY - dragStart.current.y),
    });
  
    // Update drag start position
    dragStart.current = { x: event.clientX, y: event.clientY };
  };
  

  const stopPan = () => {
    setIsDragging(false);
  };

  return (
    <div className="workspace">
      {/* Ruler Elements */}
      <div className="ruler-x" ref={rulerXRef}></div>
      <div className="ruler-y" ref={rulerYRef}></div>

      {/* Grid */}
      <div 
        className="canvas-container"
        onWheel={handleZoom}
        onMouseDown={startPan}
        onMouseMove={handlePan}
        onMouseUp={stopPan}
        onMouseLeave={stopPan}
      >
        <canvas ref={canvasRef} className="grid-canvas"></canvas>
      </div>
    </div>
  );
};

export default CanvasGrid;
