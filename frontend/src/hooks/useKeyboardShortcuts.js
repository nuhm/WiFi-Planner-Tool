import { useEffect } from 'react';

export const useKeyboardShortcuts = ({
	selected,
	clearSelected,
	undo,
	redo,
	saveStateToHistory,
	setNodes,
	setWalls,
	setAccessPoints,
}) => {
	useEffect(() => {
		const handleKeyDown = (e) => {
			const target = e.target;
			const isTyping =
				target.tagName === 'INPUT' ||
				target.tagName === 'TEXTAREA' ||
				target.isContentEditable;

			if (isTyping) return;

			if (e.key === 'Escape') {
				e.preventDefault();
				clearSelected();
			} else if (e.ctrlKey && e.key === 'z') {
				e.preventDefault();
				undo();
			} else if (
				e.ctrlKey &&
				(e.key === 'y' || (e.shiftKey && e.key === 'Z'))
			) {
				e.preventDefault();
				redo();
			} else if (e.key === 'Backspace' || e.key === 'Delete') {
				e.preventDefault();
				saveStateToHistory();

				if (selected.node) {
					const nodeId = selected.node.id;
					setNodes((prev) => prev.filter((node) => node.id !== nodeId));
					setWalls((prev) =>
						prev.filter(({ a, b }) => {
							const matchesA =
								a.id === nodeId ||
								(a.x === selected.node.x && a.y === selected.node.y);
							const matchesB =
								b.id === nodeId ||
								(b.x === selected.node.x && b.y === selected.node.y);
							return !matchesA && !matchesB;
						})
					);
					clearSelected();
				} else if (selected.wall) {
					setWalls((prev) => prev.filter((w) => w.id !== selected.wall.id));
					clearSelected();
				} else if (selected.ap) {
					setAccessPoints((prev) =>
						prev.filter((ap) => ap.id !== selected.ap.id)
					);
					clearSelected();
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [
		selected,
		clearSelected,
		undo,
		redo,
		saveStateToHistory,
		setNodes,
		setWalls,
		setAccessPoints,
	]);
};
