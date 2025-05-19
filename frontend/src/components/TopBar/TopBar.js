import './TopBar.css';
const { electronAPI } = window;

/**
 * Custom window top bar for Electron (draggable).
 * Includes minimize, maximize, and close buttons.
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
