/**
 * Redirects console.log to Electron main process (and still shows in DevTools).
 *
 * - Uses `window.electronAPI.logToMain` if available
 * - Falls back to normal console logging if it fails
 */
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
