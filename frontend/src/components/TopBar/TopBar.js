import './TopBar.css';
const { electronAPI } = window;

/**
 * Top bar with Electron window controls.
 *
 * - Minimize, maximize, and close buttons
 * - Styled to be draggable with custom window frame
 */
export default function TopBar() {
	const handleMinimize = () => electronAPI.minimize();
	const handleMaximize = () => electronAPI.maximize();
	const handleClose = () => electronAPI.close();

	return (
		<div className="topbar">
			<div className="topbarBtns">
				<button
					className="topbarBtn"
					onClick={handleMinimize}
					aria-label="Minimize window"
				>
					–
				</button>
				<button
					className="topbarBtn"
					onClick={handleMaximize}
					aria-label="Maximize window"
				>
					□
				</button>
				<button
					className="topbarBtn close"
					onClick={handleClose}
					aria-label="Close window"
				>
					×
				</button>
			</div>
		</div>
	);
}
