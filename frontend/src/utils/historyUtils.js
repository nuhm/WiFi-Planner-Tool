import { MAX_HISTORY_LENGTH } from '../constants/config';

/**
 * Saves the current canvas state to history.
 *
 * - Trims history if it exceeds max length
 * - Clears redo stack after a new change
 */
export const handleSaveStateToHistory = (
	history,
	setHistory,
	nodes,
	walls,
	accessPoints,
	setRedoStack
) => {
	if (!nodes || !walls || !accessPoints) {
		console.warn('Cannot save undefined state to history.');
		return;
	}

	const state = {
		nodes: JSON.parse(JSON.stringify(nodes)),
		walls: JSON.parse(JSON.stringify(walls)),
		accessPoints: JSON.parse(JSON.stringify(accessPoints)),
	};

	setHistory((prev) => [...prev.slice(-MAX_HISTORY_LENGTH + 1), state]);
	setRedoStack([]); // Clear redo stack on new change
};

/**
 * Undoes the last action by restoring the previous state from history.
 *
 * - Moves current state to the redo stack
 */
export const handleUndo = (
	history,
	setHistory,
	redoStack,
	setRedoStack,
	setNodes,
	setWalls,
	setAccessPoints,
	clearSelected,
	currentNodes,
	currentWalls,
	currentAccessPoints
) => {
	if (history.length === 0) return;
	const last = history[history.length - 1];
	clearSelected();

	setRedoStack((prev) => [
		...prev,
		{
			nodes: currentNodes,
			walls: currentWalls,
			accessPoints: currentAccessPoints,
		},
	]);

	setHistory(history.slice(0, -1));
	setNodes(last.nodes);
	setWalls(last.walls);
	setAccessPoints(last.accessPoints);
};

/**
 * Redoes the last undone action by restoring from the redo stack.
 *
 * - Pushes current state back into history
 */
export const handleRedo = (
	redoStack,
	setRedoStack,
	history,
	setHistory,
	setNodes,
	setWalls,
	setAccessPoints,
	clearSelected,
	currentNodes,
	currentWalls,
	currentAccessPoints
) => {
	if (redoStack.length === 0) return;
	const last = redoStack[redoStack.length - 1];
	clearSelected();

	setHistory((prev) => [
		...prev,
		{
			nodes: currentNodes,
			walls: currentWalls,
			accessPoints: currentAccessPoints,
		},
	]);

	setRedoStack(redoStack.slice(0, -1));
	setNodes(last.nodes);
	setWalls(last.walls);
	setAccessPoints(last.accessPoints);
};
