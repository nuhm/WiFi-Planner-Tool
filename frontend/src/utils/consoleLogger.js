// consoleLogger.js
export const initConsoleRedirect = () => {
	if (window.electronAPI?.logToMain) {
		const originalLog = console.log;

		console.log = (...args) => {
			try {
				window.electronAPI.logToMain(
					args
						.map((arg) =>
							typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
						)
						.join(' ')
				);
			} catch (err) {
				originalLog('Error sending log to Electron main:', err);
			}

			// Also log to DevTools as normal
			originalLog(...args);
		};
	}
};
