import { getWorldCoordinates } from '../utils/getWorldCoordinates';
import { testSignalAtPoint } from '../utils/testSignalAtPoint';

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
