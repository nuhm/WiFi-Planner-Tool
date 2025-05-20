import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ToastProvider } from './components/Toast/ToastContext';
import TopBar from './components/TopBar/TopBar';
import Home from './pages/Home/Home';
import Project from './pages/NewProject/NewProject';
import Workspace from './pages/Workspace/Workspace';
import { initConsoleRedirect } from './utils/consoleLogger';

// Redirects console.log to Electron main process
initConsoleRedirect();

/**
 * App
 *
 * Root component for the Electron + React app.
 * - Sets up routing for Home, New Project, and Workspace
 * - Wraps content in global Toast context
 * - Mounts Electron-style top bar
 */
const App = () => {
	return (
		<Router>
			<TopBar />
			<ToastProvider>
				<div className="contentWrapper">
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/newProject" element={<Project />} />
						<Route path="/workspace" element={<Workspace />} />
					</Routes>
				</div>
			</ToastProvider>
		</Router>
	);
};

export default App;
