export const drawPreview = (preview, ctx, zoom, centerX, centerY, isValidPreview, selectedNode, isAddingNode) => {

   // **Draw Preview Node (Ghost)**
   if (preview?.type === 'node') {
      ctx.fillStyle = isValidPreview
      ? "rgba(0, 255, 0, 0.5)"   // Green = valid
      : "rgba(255, 0, 0, 0.3)"; // Red = invalid
      ctx.beginPath();
      ctx.arc(centerX + preview.position.x * zoom, centerY + preview.position.y * zoom, 5, 0, Math.PI * 2);
      ctx.fill();

      if (selectedNode && isAddingNode) {
         const startX = centerX + selectedNode.x * zoom;
         const startY = centerY + selectedNode.y * zoom;
         const endX = centerX + preview.position.x * zoom;
         const endY = centerY + preview.position.y * zoom;
      
         ctx.strokeStyle = isValidPreview ? "rgba(0,255,0,0.7)" : "rgba(255,0,0,0.4)";
         ctx.lineWidth = 3;
         ctx.setLineDash([5, 5]);
         ctx.beginPath();
         ctx.moveTo(startX, startY);
         ctx.lineTo(endX, endY);
         ctx.stroke();
         ctx.setLineDash([]);
   
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
         ctx.fillStyle = "#fff";
         ctx.font = `${1 * zoom}px sans-serif`;
         ctx.textAlign = "center";
         ctx.textBaseline = "bottom";
         ctx.fillText(`${distance}m`, 0, -5);
         ctx.restore();
      }
   }

   // **Draw Preview AP (Ghost)**
   if (preview?.type === 'ap') {
      const screenX = centerX + preview.position.x * zoom;
      const screenY = centerY + preview.position.y * zoom;
      const size = 12;

      ctx.fillStyle = "rgba(0, 255, 0, 0.4)";
      ctx.fillRect(screenX - size / 2, screenY - size / 2, size, size);
   }
};