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

		const key = nodes
			.map((n) => `${n.x},${n.y}`)
			.sort()
			.join('|');
		if (!roomColorsRef[key]) {
			const hue = (nextHue * 137.508) % 360; // golden angle for better spread
			roomColorsRef[key] = `hsla(${hue}, 80%, 60%, 0.25)`;
			nextHue++;
		}

		ctx.fillStyle = roomColorsRef[key];
		ctx.fill();
	});
};
