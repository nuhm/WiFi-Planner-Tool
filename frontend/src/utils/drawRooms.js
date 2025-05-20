/**
 * Draws detected room shapes on the canvas.
 *
 * - Fills each room polygon with a unique pastel color
 * - Uses sorted node positions as a stable hash for consistent coloring
 */
export const drawRooms = (ctx, roomShapes, { zoom, centerX, centerY }) => {
	let roomColorsRef = {};
	let nextHue = 0;

	roomShapes.forEach((nodes) => {
		ctx.beginPath();
		nodes.forEach(({ x, y }, i) => {
			const screenX = centerX + x * zoom;
			const screenY = centerY + y * zoom;
			if (i === 0) ctx.moveTo(screenX, screenY);
			else ctx.lineTo(screenX, screenY);
		});
		ctx.closePath();

		// Build stable key for each room to assign consistent color
		const key = nodes
			.map((n) => `${n.x},${n.y}`)
			.sort()
			.join('|');
		if (!roomColorsRef[key]) {
			const hue = (nextHue * 137.508) % 360; // Use golden angle to generate well-spaced hues
			roomColorsRef[key] = `hsla(${hue}, 80%, 60%, 0.25)`;
			nextHue++;
		}

		ctx.fillStyle = roomColorsRef[key];
		ctx.fill();
	});
};
