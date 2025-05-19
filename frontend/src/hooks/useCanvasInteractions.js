import { useRef } from 'react';
import { getWorldCoordinates } from '../utils/getWorldCoordinates';
import { centerGrid, snapToGrid } from '../utils/gridUtils';

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
	 * Handles the panning of the canvas during drag operations.
	 * @param {MouseEvent} event - The mouse move event.
	 */
	const handlePan = (event) => {
		if (!isDraggingRef.current) return;
		document.querySelector('.grid-canvas').style.cursor = 'grabbing';

		const dx = event.clientX - dragStart.current.x;
		const dy = event.clientY - dragStart.current.y;

		setOffset({
			x: offsetStart.current.x + dx,
			y: offsetStart.current.y + dy,
		});
	};

	/**
	 * Stops the panning operation and resets the cursor.
	 */
	const stopPan = () => {
		document.querySelector('.grid-canvas').style.cursor = 'pointer';
		isDraggingRef.current = false;
	};

	/**
	 * Handles double click events to center the grid.
	 */
	const handleDoubleClick = () => {
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
