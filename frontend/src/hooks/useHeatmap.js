import { useEffect } from 'react';
import { MATERIALS } from '../constants/config';
import { getLineIntersection } from '../utils/gridUtils';

/**
 * Calculates heatmap tiles for signal strength.
 *
 * - Loops through APs and places signal tiles based on distance and wall interference
 * - Uses basic RF model + wall loss + caching for performance
 */
export const useHeatmap = ({
	accessPoints,
	walls,
	showCoverage,
	gridSize,
	rfConfig,
	setHeatmapTiles,
}) => {
	useEffect(() => {
		if (!showCoverage) return;

		const timeout = setTimeout(() => {
			const tiles = [];
			const gridStep = gridSize / 10;
			const obstructionCache = new Map();

			const makeKey = (apX, apY, gx, gy) =>
				`${apX.toFixed(1)}:${apY.toFixed(1)}:${gx.toFixed(1)},${gy.toFixed(1)}`;

			accessPoints.forEach((ap) => {
				const txPower = ap.config?.power ?? rfConfig.txPower;
				const maxRange = ap.config?.range ?? rfConfig.maxRangeMeters;

				const pl0 = rfConfig.pl0;
				const d0 = rfConfig.d0;
				const n = rfConfig.n;

				// Loop over a square grid around each AP to compute signal tiles
				const steps = Math.ceil(maxRange / gridStep);
				for (let i = -steps; i <= steps; i++) {
					for (let j = -steps; j <= steps; j++) {
						const dx = i * gridStep;
						const dy = j * gridStep;
						const dist = Math.sqrt(dx * dx + dy * dy);
						if (dist > maxRange) continue;

						const worldX = ap.x - gridStep / 2 + dx;
						const worldY = ap.y - gridStep / 2 + dy;

						const key = makeKey(ap.x, ap.y, worldX, worldY);
						let totalWallLoss = 0;

						// Cache wall loss calculations between each AP and tile to avoid repeats
						if (obstructionCache.has(key)) {
							totalWallLoss = obstructionCache.get(key);
						} else {
							totalWallLoss = walls.reduce((loss, { a, b, config }) => {
								const intersects = getLineIntersection(
									{ x: ap.x, y: ap.y },
									{ x: worldX, y: worldY },
									a,
									b
								);
								if (intersects) {
									const thickness = config?.thickness ?? 1;
									const signalLossPerMm =
										config?.signalLoss ??
										MATERIALS[config?.material]?.signalLoss ??
										1;
									return loss + signalLossPerMm * thickness;
								}
								return loss;
							}, 0);
							obstructionCache.set(key, totalWallLoss);
						}

						const pathLoss =
							pl0 + 10 * n * Math.log10(dist / d0) + totalWallLoss;
						const signal = txPower - pathLoss;

						tiles.push({ x: worldX, y: worldY, signal });
					}
				}
			});

			setHeatmapTiles(tiles);
		}, 10);

		return () => clearTimeout(timeout);
	}, [accessPoints, walls, showCoverage, gridSize, rfConfig, setHeatmapTiles]);
};
