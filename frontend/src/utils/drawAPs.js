import {
	AP_COLOR,
	DEFAULT_RF_CONFIG,
	SELECTED_COLOR,
	TEXT_COLOR,
} from '../constants/config';

export const drawAPs = (
	ctx,
	accessPoints,
	selected,
	{ zoom, centerX, centerY }
) => {
	ctx.fillStyle = AP_COLOR;
	accessPoints.forEach((ap) => {
		const maxRange = ap.config?.range ?? DEFAULT_RF_CONFIG.maxRangeMeters;

		const apScreenX = centerX + ap.x * zoom;
		const apScreenY = centerY + ap.y * zoom;
		ctx.beginPath();
		ctx.arc(apScreenX, apScreenY, maxRange * zoom, 0, Math.PI * 2);
		ctx.strokeStyle = 'rgba(29, 93, 191, 0.5)';
		ctx.lineWidth = 1;
		ctx.stroke();

		const screenX = centerX + ap.x * zoom;
		const screenY = centerY + ap.y * zoom;
		const size = 12;

		ctx.fillRect(screenX - size / 2, screenY - size / 2, size, size);

		if (ap.name) {
			ctx.font = `${0.5 * zoom}px sans-serif`;
			ctx.fillStyle = TEXT_COLOR;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'bottom';
			ctx.fillText(ap.name, screenX, screenY - size / 2 - 2);
		}
	});

	// Highlight selected AP
	if (selected.ap) {
		const screenX = centerX + selected.ap.x * zoom;
		const screenY = centerY + selected.ap.y * zoom;
		const size = 16;

		ctx.strokeStyle = SELECTED_COLOR;
		ctx.lineWidth = 3;
		ctx.strokeRect(screenX - size / 2, screenY - size / 2, size, size);
	}
};
