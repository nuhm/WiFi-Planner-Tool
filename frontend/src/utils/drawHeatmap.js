export const drawHeatmap = ({
	ctx,
	canvas,
	tiles,
	centerX,
	centerY,
	gridStep,
	zoom,
	mode,
	showStrength,
	rawCursorPos,
}) => {
	const signalToColor = (dbm) => {
		const minDbm = -90;
		const maxDbm = -35;
		let normalized = (dbm - minDbm) / (maxDbm - minDbm);
		normalized = Math.min(Math.max(normalized, 0), 1);
		const eased = Math.pow(normalized, 2.2);
		const green = Math.floor(eased * 255);
		const red = 255 - green;
		return `rgba(${red}, ${green}, 0, 0.35)`;
	};

	tiles.forEach(({ x, y, signal }) => {
		const screenX = centerX + x * zoom;
		const screenY = centerY + y * zoom;
		const buffer = gridStep * zoom;
		if (
			screenX < -buffer ||
			screenY < -buffer ||
			screenX > canvas.width + buffer ||
			screenY > canvas.height + buffer
		)
			return;

		ctx.fillStyle = signalToColor(signal);
		ctx.fillRect(
			screenX - (gridStep * zoom) / 2,
			screenY - (gridStep * zoom) / 2,
			gridStep * zoom,
			gridStep * zoom
		);

		const labelRadius = gridStep * 4;
		let drawLabel = showStrength;
		let opacity = 1;

		if (!showStrength && rawCursorPos) {
			const dx = rawCursorPos.x - x;
			const dy = rawCursorPos.y - y;
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (dist < labelRadius) {
				drawLabel = true;
				const falloff = 1 - dist / labelRadius;
				opacity = Math.pow(falloff, 1.5);
			}
		}

		if (zoom > 0.5 && mode.isTestingSignal && drawLabel) {
			ctx.globalAlpha = opacity * 0.9;
			ctx.fillStyle = signal < -70 ? 'white' : 'black';
			ctx.font = `${Math.max(0.4 * zoom, 0.2)}px Arial`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(`${Math.round(signal)}`, screenX, screenY);
			ctx.globalAlpha = 1;
		}
	});
};
