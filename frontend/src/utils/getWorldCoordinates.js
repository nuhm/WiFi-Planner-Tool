/**
 * Converts a mouse event to canvas world coordinates.
 *
 * - Adjusts for zoom and canvas offset
 * - Returns snapped position relative to grid center
 */
export const getWorldCoordinates = (event, canvas, offset, zoom) => {
	const rect = canvas.getBoundingClientRect();
	const centerX = rect.width / 2;
	const centerY = rect.height / 2;

	const x = (event.clientX - rect.left - centerX - offset.x) / zoom;
	const y = (event.clientY - rect.top - centerY - offset.y) / zoom;

	return { x, y };
};
