export const CanvasToggleButton = ({ label, state, onClick }) => (
	<button className="canvasOverlayButton" onClick={onClick}>
		{state ? `Hide ${label}` : `Show ${label}`}
	</button>
);
