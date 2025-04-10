export const createGrid = (canvas, ctx, zoom, centerX, centerY, gridSize, subGridSize, subSubGridSize) => {

   if (zoom > 5) {
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
   
   if (zoom > 10) {
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
};