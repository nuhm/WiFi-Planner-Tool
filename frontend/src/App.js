import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ToastProvider } from './components/Toast/ToastContext';
import TopBar from './components/TopBar/TopBar';
import { initConsoleRedirect } from './utils/consoleLogger';
import Home from './pages/Home/Home';
import Project from './pages/NewProject/NewProject';
import Workspace from './pages/Workspace/Workspace';

initConsoleRedirect();

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
