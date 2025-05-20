import { useRef } from 'react';
import { getWorldCoordinates } from '../utils/getWorldCoordinates';
import { centerGrid, snapToGrid } from '../utils/gridUtils';

/**
 * Hook for handling canvas interactions.
 *
 * - Handles mouse movement, node/AP placement, signal testing, and panning
 * - Used as the core logic behind user interaction on the grid
 */
export const useCanvasInteractions = ({
	canvasRef,
	mode,
	zoom,
	offset,
	lastAddedNode,
	setCursorPos,
	setPreview,
	setIsValidPreview,
	clearSelected,
	setRawCursorPos,
	isAllowedAngle,
	startSelect,
	deleteAP,
	addAP,
	addNode,
	deleteNode,
	testSignalAtCursor,
	setOffset,
}) => {
	const isDraggingRef = useRef(false);
	const dragStart = useRef({ x: 0, y: 0 });
	const lastUpdate = useRef(Date.now());
	const offsetStart = useRef({ x: 0, y: 0 });

	/**
	 * Updates cursor, handles snapping, and sets preview overlays.
	 */
	const handleMouseMove = (event) => {
		handlePan(event);

		const now = Date.now();
		if (now - lastUpdate.current < 16) return;

		lastUpdate.current = now;

		const { x, y } = getWorldCoordinates(
			event,
			canvasRef.current,
			offset,
			zoom
		);
		const snappedPos = snapToGrid(x, y);
		setCursorPos(snappedPos);
		setRawCursorPos({ x, y });

		if (mode.isAddingNode) {
			setPreview({ type: 'node', position: snappedPos });

			if (lastAddedNode) {
				const dx = snappedPos.x - lastAddedNode.x;
				const dy = snappedPos.y - lastAddedNode.y;
				setIsValidPreview(isAllowedAngle(dx, dy));
			} else {
				setIsValidPreview(true);
			}
		} else if (mode.isPlacingAP) {
			setPreview({ type: 'ap', position: snappedPos });
		} else {
			setPreview(null);
		}
	};

	/**
	 * Triggers actions based on tool mode when mouse is pressed.
	 */
	const handleMouseDown = (event) => {
		if (event.button === 1 || mode.isPanning) {
			isDraggingRef.current = true;
			dragStart.current = { x: event.clientX, y: event.clientY };
			offsetStart.current = { ...offset };
			return;
		}

		clearSelected();

		if (event.button === 2 || event.escape) return;

		if (mode.isSelecting) {
			startSelect(event);
			return;
		}

		if (mode.isPlacingAP && event.shiftKey) {
			deleteAP(event);
		} else if (mode.isPlacingAP) {
			addAP(event);
		}

		if (mode.isTestingSignal) {
			testSignalAtCursor(event);
			return;
		}

		if (mode.isAddingNode && event.shiftKey) {
			deleteNode(event);
		} else if (mode.isAddingNode) {
			addNode(event);
		}
	};

	/**
	 * Handles drag-to-pan movement.
	 */
	const handlePan = (event) => {
		if (!isDraggingRef.current) return;
		document.querySelector('.gridCanvas').style.cursor = 'grabbing';

		const dx = event.clientX - dragStart.current.x;
		const dy = event.clientY - dragStart.current.y;

		setOffset({
			x: offsetStart.current.x + dx,
			y: offsetStart.current.y + dy,
		});
	};

	/**
	 * Ends dragging and resets the cursor.
	 */
	const stopPan = () => {
		document.querySelector('.gridCanvas').style.cursor = 'pointer';
		isDraggingRef.current = false;
	};

	/**
	 * Double-click to recenter the grid.
	 */
	const handleDoubleClick = () => {
		if (!mode.isPanning) return;
		centerGrid(setOffset);
	};

	return {
		handleMouseMove,
		handleMouseDown,
		handlePan,
		stopPan,
		handleDoubleClick,
	};
};
