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
				onClick={() => handleToolClick('isPanning', 'grabbing')}
			>
				✖️ Pan Tool
			</button>

			<button
				className={`toolbar-button ${mode.isSelecting ? 'active' : ''}`}
				onClick={() => handleToolClick('isSelecting')}
			>
				✖️ Selector Tool
			</button>

			<button
				className={`toolbar-button ${mode.isAddingNode ? 'active' : ''}`}
				onClick={() => handleToolClick('isAddingNode')}
			>
				🧱 Wall Tool
			</button>

			<button
				className={`toolbar-button ${mode.isPlacingAP ? 'active' : ''}`}
				onClick={() => handleToolClick('isPlacingAP')}
			>
				➕ AP Tool
			</button>

			<button
				className={`toolbar-button ${mode.isTestingSignal ? 'active' : ''}`}
				onClick={() => handleToolClick('isTestingSignal')}
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
