/**
* Saves the current state of nodes and walls to the history stack for undo functionality.
*/
export const handleSaveStateToHistory = (history, setHistory, nodes, walls, setRedoStack, MAX_HISTORY_LENGTH) => {
  const state = {
    nodes: JSON.parse(JSON.stringify(nodes)),
    walls: JSON.parse(JSON.stringify(walls)),
  };
  setHistory(prev => [...prev.slice(-MAX_HISTORY_LENGTH + 1), state]);
  setRedoStack([]); // Clear redo stack on new change
};


/**
* Undoes the last action by restoring the previous state from history.
*/
export const handleUndo = (history, setHistory, redoStack, setRedoStack, setNodes, setWalls, clearSelected, currentNodes, currentWalls) => {
  if (history.length === 0) return;
  const last = history[history.length - 1];
  clearSelected();
  setRedoStack([...redoStack, { nodes: currentNodes, walls: currentWalls }]);
  setHistory(history.slice(0, history.length - 1));
  setNodes(last.nodes);
  setWalls(last.walls);
};

/**
* Redoes the last undone action by restoring the state from the redo stack.
*/
export const handleRedo = (redoStack, setRedoStack, history, setHistory, setNodes, setWalls, clearSelected, currentNodes, currentWalls) => {
  if (redoStack.length === 0) return;
  const last = redoStack[redoStack.length - 1];
  clearSelected();
  setHistory([...history, { nodes: currentNodes, walls: currentWalls }]);
  setRedoStack(redoStack.slice(0, redoStack.length - 1));
  setNodes(last.nodes);
  setWalls(last.walls);
};
