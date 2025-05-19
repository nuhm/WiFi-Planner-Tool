export const ToggleButton = ({ label, state, onClick }) => (
	<button className="canvas-overlay-button" onClick={onClick}>
		{state ? `Hide ${label}` : `Show ${label}`}
	</button>
);
