import { DEFAULT_RF_CONFIG, MATERIALS } from '../constants/config';
import { getLineIntersection } from './gridUtils';

/**
 * Estimates WiFi signal at a specific point.
 *
 * - Calculates path loss using log-distance formula
 * - Adds wall attenuation for each wall intersecting the path
 * - Returns best signal from all APs within range
 */
export const testSignalAtPoint = (point, accessPoints, walls) => {
	let bestSignal = -Infinity;
	let bestAP = null;

	accessPoints.forEach((ap) => {
		const txPower = ap.config?.power ?? DEFAULT_RF_CONFIG.txPower;
		const maxRange = ap.config?.range ?? DEFAULT_RF_CONFIG.maxRangeMeters;
		const pl0 = DEFAULT_RF_CONFIG.pl0;
		const d0 = DEFAULT_RF_CONFIG.d0;
		const n = DEFAULT_RF_CONFIG.n;

		// Skip APs beyond range or at exact test point
		const dist = Math.hypot(ap.x - point.x, ap.y - point.y);
		if (dist === 0 || dist > maxRange) return;

		const wallLoss = walls.reduce((loss, { a, b, config }) => {
			const intersects = getLineIntersection(ap, point, a, b);
			if (intersects) {
				const thickness = config?.thickness ?? 1;
				const signalLossPerMm =
					config?.signalLoss ?? MATERIALS[config?.material]?.signalLoss ?? 1;
				return loss + signalLossPerMm * thickness;
			}
			return loss;
		}, 0);

		const pathLoss = pl0 + 10 * n * Math.log10(dist / d0) + wallLoss;
		const signal = txPower - pathLoss;

		if (signal > bestSignal) {
			bestSignal = signal;
			bestAP = ap;
		}
	});

	if (!bestAP) return null;

	const quality =
		bestSignal > -50
			? 'Excellent'
			: bestSignal > -60
			? 'Good'
			: bestSignal > -70
			? 'Fair'
			: 'Weak';

	return {
		signal: bestSignal,
		ap: bestAP,
		quality,
	};
};
