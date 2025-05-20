import { MATERIALS, SELECTED_COLOR, TEXT_COLOR } from '../constants/config';

/**
 * Draws all walls on the canvas.
 *
 * - Sets color and thickness based on wall material
 * - Highlights the selected wall
 * - Optionally displays wall length in meters
 */
export const drawWalls = (
	ctx,
	walls,
	{ zoom, centerX, centerY, showUnits, selected }
) => {
	walls.forEach((wall) => {
		const { a: startNode, b: endNode } = wall;
		const dx = endNode.x - startNode.x;
		const dy = endNode.y - startNode.y;
		const length = Math.sqrt(dx * dx + dy * dy);

		// Skip zero-length walls
		if (length === 0) {
			console.log('⚠️ Zero-length wall detected:', startNode, endNode);
			return;
		}

		const startX = centerX + startNode.x * zoom;
		const startY = centerY + startNode.y * zoom;
		const endX = centerX + endNode.x * zoom;
		const endY = centerY + endNode.y * zoom;

		const thickness = wall.config?.thickness ?? 100;
		ctx.lineWidth = Math.max(5, thickness / 25);

		const material = wall.config?.material ?? 'unknown';
		const color = MATERIALS[material].color ?? MATERIALS.unknown.color;

		ctx.strokeStyle =
			selected.wall && wall.id === selected.wall.id ? SELECTED_COLOR : color;

		ctx.beginPath();
		ctx.moveTo(startX, startY);
		ctx.lineTo(endX, endY);
		ctx.stroke();

		if (showUnits) {
			// Calculate midpoint and angle for label rotation
			const displayLength = length.toFixed(2);
			const midX = (startX + endX) / 2;
			const midY = (startY + endY) / 2;

			const angle = Math.atan2(endY - startY, endX - startX);
			const flip = Math.abs(angle) > Math.PI / 2;

			ctx.save();
			ctx.translate(midX, midY);
			ctx.rotate(angle + (flip ? Math.PI : 0));
			ctx.font = `${0.5 * zoom}px sans-serif`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'bottom';
			ctx.fillStyle = TEXT_COLOR;
			ctx.fillText(`${displayLength}m`, 0, -5);
			ctx.restore();
		}
	});
};
