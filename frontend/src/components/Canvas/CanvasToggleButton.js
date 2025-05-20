/**
 * Button for toggling a canvas overlay feature.
 *
 * - Shows or hides a specific element like grid, coverage, etc.
 */
export const CanvasToggleButton = ({ label, state, onClick }) => (
	<button className="canvasOverlayButton" onClick={onClick}>
		{state ? `Hide ${label}` : `Show ${label}`}
	</button>
);
