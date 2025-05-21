const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

let mainWindow;

/**
 * Electron Main Process
 *
 * - Creates a frameless window sized to 75% of screen
 * - Loads React app on localhost
 * - Listens to IPC messages for window control and logging
 */
function createMainWindow() {
	const { width, height } = screen.getPrimaryDisplay().workAreaSize;
	const scaledWidth = Math.floor(width * 0.75);
	const scaledHeight = Math.floor(height * 0.75);

	mainWindow = new BrowserWindow({
		width: scaledWidth,
		height: scaledHeight,
		frame: false,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	mainWindow.loadURL(
		isDev
			? 'http://localhost:3000'
			: `file://${path.join(__dirname, 'build', 'index.html')}`
	);

	mainWindow.on('closed', () => (mainWindow = null));
}

ipcMain.on('log-message', (event, msg) => {
	console.log(`[Renderer Log] ${msg}`);
});
ipcMain.on('window:minimize', () => mainWindow.minimize());
ipcMain.on('window:maximize', () => {
	mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});
ipcMain.on('window:close', () => app.quit());
ipcMain.on('quit-app', () => app.quit());

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});

app.on('ready', createMainWindow);
app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
