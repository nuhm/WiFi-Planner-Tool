import { useCallback, useEffect } from 'react';
import { ZOOM } from '../constants/config';

export const useZoom = (canvasRef, setZoom) => {
	const clampZoom = (zoom) => Math.max(ZOOM.MIN, Math.min(zoom, ZOOM.MAX));

	const handleZoom = useCallback(
		(event) => {
			event.preventDefault();
			const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
			setZoom((prevZoom) => clampZoom(prevZoom * zoomFactor));
		},
		[setZoom]
	);

	useEffect(() => {
		const el = canvasRef.current;
		if (!el) return;
		el.addEventListener('wheel', handleZoom, { passive: false });
		return () => el.removeEventListener('wheel', handleZoom);
	}, [handleZoom, canvasRef]);
};
