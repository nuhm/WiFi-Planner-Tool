/**
 * Draws the full grid (sub-sub, sub, main) and a center crosshair.
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D context
 * @param {number} zoom - Current zoom level
 * @param {number} centerX - X offset of the center point
 * @param {number} centerY - Y offset of the center point
 * @param {{ subSub: number, sub: number, main: number }} gridSizes - Object containing grid sizes
 */
export const createGrid = (canvas, ctx, zoom, centerX, centerY, gridSizes) => {
  // Helper to draw vertical & horizontal lines
  const drawGridLines = (spacing, color, width) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;

    for (let x = centerX % spacing; x < canvas.width; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = centerY % spacing; y < canvas.height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  };

  // Draw layers based on zoom
  if (zoom > 10) drawGridLines(gridSizes.subSub, "#999", 0.25);
  if (zoom > 5) drawGridLines(gridSizes.sub, "#999", 0.5);
  drawGridLines(gridSizes.main, "#999", 1);

  // Draw center crosshair (always visible)
  drawCrosshair(centerX, centerY, canvas, ctx);
};

// Helper for center crosshair
const drawCrosshair = (centerX, centerY, canvas, ctx) => {
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
