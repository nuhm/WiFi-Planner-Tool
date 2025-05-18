/**
 * Converts a mouse event to world coordinates on the canvas grid.
 * @param {MouseEvent} event - The mouse event
 * @param {HTMLCanvasElement} canvas - The canvas element (use canvasRef.current)
 * @param {{ x: number, y: number }} offset - Current canvas offset
 * @param {number} zoom - Current zoom level
 * @returns {{ x: number, y: number }} - Grid-based world coordinates
 */
export const getWorldCoordinates = (event, canvas, offset, zoom) => {
  const rect = canvas.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const x = (event.clientX - rect.left - centerX - offset.x) / zoom;
    const y = (event.clientY - rect.top - centerY - offset.y) / zoom;

  return { x, y };
};
