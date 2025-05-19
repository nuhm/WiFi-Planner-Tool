import { useCallback, useEffect } from 'react';

export const useKeyboardShortcuts = ({
	selected,
	clearSelected,
	undo,
	redo,
	saveStateToHistory,
	setNodes,
	setWalls,
	setAccessPoints,
	setSelected,
}) => {
	const isTypingElement = (target) =>
		target.tagName === 'INPUT' ||
		target.tagName === 'TEXTAREA' ||
		target.isContentEditable;

	const handleDelete = useCallback(() => {
		saveStateToHistory();

		if (selected.node) {
			const nodeId = selected.node.id;
			setNodes((prev) => prev.filter((n) => n.id !== nodeId));
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
		} else if (selected.wall) {
			setWalls((prev) => prev.filter((w) => w.id !== selected.wall.id));
		} else if (selected.ap) {
			setAccessPoints((prev) => prev.filter((ap) => ap.id !== selected.ap.id));
		}

		setSelected({ node: null, wall: null, ap: null });
	}, [
		selected,
		saveStateToHistory,
		setNodes,
		setWalls,
		setAccessPoints,
		setSelected,
	]);

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (isTypingElement(e.target)) return;

			const key = e.key.toLowerCase();
			const isCtrl = e.ctrlKey || e.metaKey;

			switch (true) {
				case key === 'escape':
					e.preventDefault();
					clearSelected();
					break;

				case isCtrl && key === 'z' && !e.shiftKey:
					e.preventDefault();
					undo();
					break;

				case isCtrl && (key === 'y' || (e.shiftKey && key === 'z')):
					e.preventDefault();
					redo();
					break;

				case key === 'backspace' || key === 'delete':
					e.preventDefault();
					handleDelete();
					break;

				default:
					return;
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [clearSelected, undo, redo, handleDelete]);
};
