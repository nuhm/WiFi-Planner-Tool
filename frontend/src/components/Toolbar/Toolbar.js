import { TOOL_MODES } from '../../constants/toolModes';

export const Toolbar = ({
	mode,
	toggleMode,
	deselectButtons,
	clearGrid,
	navigate,
}) => {
	const setCursor = (type) => {
		const canvas = document.querySelector('.grid-canvas');
		if (canvas) canvas.style.cursor = type;
	};

	const handleToolClick = (toolKey, cursor = 'pointer') => {
		setCursor(cursor);
		deselectButtons();
		toggleMode(toolKey);
	};

	return (
		<div className="toolbar">
			<button
				className="toolbar-button negative-button"
				onClick={() => navigate('/')}
			>
				✖ Exit
			</button>

			<button
				className={`toolbar-button ${mode.isPanning ? 'active' : ''}`}
				onClick={() => handleToolClick(TOOL_MODES.PAN, 'grabbing')}
			>
				✖️ Pan Tool
			</button>

			<button
				className={`toolbar-button ${mode.isSelecting ? 'active' : ''}`}
				onClick={() => handleToolClick(TOOL_MODES.SELECT)}
			>
				✖️ Selector Tool
			</button>

			<button
				className={`toolbar-button ${mode.isAddingNode ? 'active' : ''}`}
				onClick={() => handleToolClick(TOOL_MODES.ADD_NODE)}
			>
				🧱 Wall Tool
			</button>

			<button
				className={`toolbar-button ${mode.isPlacingAP ? 'active' : ''}`}
				onClick={() => handleToolClick(TOOL_MODES.PLACE_AP)}
			>
				➕ AP Tool
			</button>

			<button
				className={`toolbar-button ${mode.isTestingSignal ? 'active' : ''}`}
				onClick={() => handleToolClick(TOOL_MODES.TEST_SIGNAL)}
			>
				📶 Tester Tool
			</button>

			<button
				className="toolbar-button negative-button"
				onClick={() => {
					setCursor('pointer');
					clearGrid();
				}}
			>
				🗑️ Clear Grid
			</button>
		</div>
	);
};
