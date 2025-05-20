/**
 * Draws the full grid (main, sub, sub-sub) and a center crosshair.
 *
 * - Grid detail depends on zoom level
 * - Crosshair always appears at the canvas center
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
	if (zoom > 10) drawGridLines(gridSizes.subSub, '#999', 0.25);
	if (zoom > 5) drawGridLines(gridSizes.sub, '#999', 0.5);
	drawGridLines(gridSizes.main, '#999', 1);

	// Draw center crosshair (always visible)
	drawCrosshair(centerX, centerY, canvas, ctx);
};

/**
 * Draws a crosshair at the center of the canvas.
 */
const drawCrosshair = (centerX, centerY, canvas, ctx) => {
	ctx.strokeStyle = '#888';
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
