/**
 * Renders a preview element (node or AP) on the canvas during placement.
 * @param {Object} preview - The preview object (must include type and position)
 * @param {CanvasRenderingContext2D} ctx - The 2D canvas context
 * @param {number} zoom - Current zoom level
 * @param {number} centerX - Canvas center X
 * @param {number} centerY - Canvas center Y
 * @param {boolean} isValidPreview - Whether placement is valid
 * @param {Object} selectedNode - The node being extended from (if applicable)
 * @param {boolean} isAddingNode - Whether we're in node-adding mode
 */
export const drawPreview = (
	preview,
	ctx,
	zoom,
	centerX,
	centerY,
	isValidPreview,
	selectedNode,
	isAddingNode
) => {
	if (!preview) return;

	if (preview.type === 'node') {
		drawPreviewNode(preview, ctx, zoom, centerX, centerY, isValidPreview);

		if (selectedNode && isAddingNode) {
			drawPreviewWallWithMeasurement(
				preview,
				selectedNode,
				ctx,
				zoom,
				centerX,
				centerY,
				isValidPreview
			);
		}
	}

	if (preview.type === 'ap') {
		drawPreviewAP(preview, ctx, zoom, centerX, centerY);
	}
};

// Draw ghost node preview
const drawPreviewNode = (preview, ctx, zoom, centerX, centerY, isValid) => {
	ctx.fillStyle = isValid
		? 'rgba(0, 255, 0, 0.5)' // Green = valid
		: 'rgba(255, 0, 0, 0.3)'; // Red = invalid

	const x = centerX + preview.position.x * zoom;
	const y = centerY + preview.position.y * zoom;

	ctx.beginPath();
	ctx.arc(x, y, 5, 0, Math.PI * 2);
	ctx.fill();
};

// Draw dashed preview wall and distance label
const drawPreviewWallWithMeasurement = (
	preview,
	selectedNode,
	ctx,
	zoom,
	centerX,
	centerY,
	isValid
) => {
	const startX = centerX + selectedNode.x * zoom;
	const startY = centerY + selectedNode.y * zoom;
	const endX = centerX + preview.position.x * zoom;
	const endY = centerY + preview.position.y * zoom;

	ctx.strokeStyle = isValid ? 'rgba(0,255,0,0.7)' : 'rgba(255,0,0,0.4)';
	ctx.lineWidth = 3;
	ctx.setLineDash([5, 5]);
	ctx.beginPath();
	ctx.moveTo(startX, startY);
	ctx.lineTo(endX, endY);
	ctx.stroke();
	ctx.setLineDash([]);

	// Draw distance text
	const dx = preview.position.x - selectedNode.x;
	const dy = preview.position.y - selectedNode.y;
	const distance = Math.sqrt(dx * dx + dy * dy).toFixed(2);
	const midX = (startX + endX) / 2;
	const midY = (startY + endY) / 2;
	const angle = Math.atan2(endY - startY, endX - startX);
	const flip = Math.abs(angle) > Math.PI / 2;

	ctx.save();
	ctx.translate(midX, midY);
	ctx.rotate(angle + (flip ? Math.PI : 0));
	ctx.fillStyle = '#fff';
	ctx.font = `${0.5 * zoom}px sans-serif`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'bottom';
	ctx.fillText(`${distance}m`, 0, -5);
	ctx.restore();
};

// Draw ghost AP preview
const drawPreviewAP = (preview, ctx, zoom, centerX, centerY) => {
	const x = centerX + preview.position.x * zoom;
	const y = centerY + preview.position.y * zoom;
	const size = 12;

	ctx.fillStyle = 'rgba(0, 255, 0, 0.4)';
	ctx.fillRect(x - size / 2, y - size / 2, size, size);
};
