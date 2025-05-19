const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	logToMain: (msg) => ipcRenderer.send('log-message', msg),
	minimize: () => ipcRenderer.send('window:minimize'),
	maximize: () => ipcRenderer.send('window:maximize'),
	close: () => ipcRenderer.send('window:close'),
	quitApp: () => ipcRenderer.send('quit-app'),
});
