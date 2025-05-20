const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload Script
 *
 * Exposes secure IPC bridge functions to the renderer via `window.electronAPI`.
 * Enables renderer to:
 * - Send logs to the main process
 * - Control window actions (minimize, maximize, close, quit)
 */
contextBridge.exposeInMainWorld('electronAPI', {
	logToMain: (msg) => ipcRenderer.send('log-message', msg),
	minimize: () => ipcRenderer.send('window:minimize'),
	maximize: () => ipcRenderer.send('window:maximize'),
	close: () => ipcRenderer.send('window:close'),
	quitApp: () => ipcRenderer.send('quit-app'),
});
