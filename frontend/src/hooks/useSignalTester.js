import { getWorldCoordinates } from '../utils/getWorldCoordinates';
import { testSignalAtPoint } from '../utils/testSignalAtPoint';

/**
 * Tests WiFi signal at the clicked point on the canvas.
 *
 * - Shows a toast with signal strength, AP name, and quality
 * - Uses current zoom/offset to map click to canvas coordinates
 */
export const useSignalTester = ({
	accessPoints,
	walls,
	showToast,
	offset,
	zoom,
	canvasRef,
}) => {
	return (event) => {
		const { x, y } = getWorldCoordinates(
			event,
			canvasRef.current,
			offset,
			zoom
		);
		const result = testSignalAtPoint({ x, y }, accessPoints, walls);

		if (!result) {
			showToast('❌ No signal detected at this location.');
			return;
		}

		const { signal, ap, quality } = result;
		showToast(
			`📶 Signal strength: ${Math.round(signal)} dBm\nFrom ${
				ap.name
			}\nEstimated quality: ${quality}`
		);
	};
};
