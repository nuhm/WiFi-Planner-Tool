import { NODE_COLOR, SELECTED_COLOR } from '../constants/config';

/**
 * Draws all nodes on the canvas.
 *
 * - Fills each node as a small circle
 * - Highlights the selected node with an outline
 */
export const drawNodes = (ctx, nodes, selected, { zoom, centerX, centerY }) => {
	ctx.fillStyle = NODE_COLOR;
	nodes.forEach(({ x, y }) => {
		ctx.beginPath();
		ctx.arc(centerX + x * zoom, centerY + y * zoom, 6, 0, Math.PI * 2);
		ctx.fill();
	});

	// Draw Selected Node Highlight (after normal nodes)
	if (selected.node) {
		const selectedX = centerX + selected.node.x * zoom;
		const selectedY = centerY + selected.node.y * zoom;

		// Outline
		ctx.beginPath();
		ctx.arc(selectedX, selectedY, 8, 0, Math.PI * 2);
		ctx.strokeStyle = SELECTED_COLOR;
		ctx.lineWidth = 3;
		ctx.stroke();
	}
};
