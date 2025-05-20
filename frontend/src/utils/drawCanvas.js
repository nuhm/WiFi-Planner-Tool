import { createGrid } from './createGrid';
import { drawAPs } from './drawAPs';
import { drawHeatmap } from './drawHeatmap';
import { drawNodes } from './drawNodes';
import { drawPreview } from './drawPreview';
import { drawRooms } from './drawRooms';
import { drawWalls } from './drawWalls';

/**
 * Main render function for the canvas.
 *
 * - Clears and redraws all visual elements based on current state
 * - Calls grid, rooms, heatmap, walls, nodes, APs, and preview renderers
 */
export const drawCanvas = ({ canvas, ctx, state, deps }) => {
	const { offset, zoom, gridSizes } = state;
	const {
		showGrid,
		showRooms,
		showCoverage,
		showUnits,
		showStrength,
		nodes,
		walls,
		accessPoints,
		selected,
		roomShapes,
		heatmapTiles,
		rawCursorPos,
		preview,
		isValidPreview,
		mode,
	} = deps;

	canvas.width = window.innerWidth * 2;
	canvas.height = window.innerHeight * 2;
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	const centerX = canvas.width / 2 + offset.x;
	const centerY = canvas.height / 2 + offset.y;

	if (showGrid) createGrid(canvas, ctx, zoom, centerX, centerY, gridSizes);
	if (showRooms) drawRooms(ctx, roomShapes, { zoom, centerX, centerY });

	const gridStep = gridSizes.base / 10;
	if (showCoverage) {
		drawHeatmap({
			ctx,
			canvas,
			tiles: heatmapTiles,
			centerX,
			centerY,
			gridStep,
			zoom,
			mode,
			showStrength,
			rawCursorPos,
		});
	}

	drawWalls(ctx, walls, { zoom, centerX, centerY, showUnits, selected });
	drawNodes(ctx, nodes, selected, {
		zoom,
		centerX,
		centerY,
		showUnits,
		selected,
	});
	drawAPs(ctx, accessPoints, selected, { zoom, centerX, centerY });
	drawPreview(
		preview,
		ctx,
		zoom,
		centerX,
		centerY,
		isValidPreview,
		selected.node,
		mode.isAddingNode
	);
};
