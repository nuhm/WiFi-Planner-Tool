import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Project from "./components/NewProject";
import Home from "./pages/Home";
import Workspace from "./pages/Workspace";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/newProject" element={<Project />} />
        <Route path="/workspace" element={<Workspace />} />
      </Routes>
    </Router>
  );
};

export default App;
