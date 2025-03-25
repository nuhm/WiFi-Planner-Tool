import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Project from "./components/NewProject";
import TopBar from "./components/TopBar";
import { initConsoleRedirect } from "./consoleLogger";
import Home from "./pages/Home";
import Workspace from "./pages/Workspace";

initConsoleRedirect();

const App = () => {
  return (
    <Router>
      <TopBar />
      <div className='contentWrapper'>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/newProject" element={<Project />} />
          <Route path="/workspace" element={<Workspace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
