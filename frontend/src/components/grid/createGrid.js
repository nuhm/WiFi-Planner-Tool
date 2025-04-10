export const createGrid = (canvas, ctx, zoom, centerX, centerY, gridSizes) => {

   if (zoom > 5) {
      ctx.strokeStyle = "#666";
      ctx.lineWidth = 0.5;
      for (let x = centerX % gridSizes.sub; x < canvas.width; x += gridSizes.sub) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
      }
      for (let y = centerY % gridSizes.sub; y < canvas.height; y += gridSizes.sub) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
      }
   }
   
   if (zoom > 10) {
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 0.25;
      for (let x = centerX % gridSizes.subSub; x < canvas.width; x += gridSizes.subSub) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
      }
      for (let y = centerY % gridSizes.subSub; y < canvas.height; y += gridSizes.subSub) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
      }
   }
   
   // **Draw Main Grid**
   ctx.strokeStyle = "#777";
   ctx.lineWidth = 1;
   for (let x = centerX % gridSizes.main; x < canvas.width; x += gridSizes.main) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
   }
   for (let y = centerY % gridSizes.main; y < canvas.height; y += gridSizes.main) {
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