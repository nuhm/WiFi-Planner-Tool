import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import "../styles/Workspace.css";
import CanvasGrid from "../components/CanvasGrid";

const Workspace = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialProject = location.state || {};
  const [projectName, setProjectName] = useState(initialProject.name || "Untitled Project");
  const [description, setDescription] = useState(initialProject.description || "No description.");

  // Save edits to localStorage
  useEffect(() => {
    const storedProjects = JSON.parse(localStorage.getItem("projects")) || [];
    const updatedProjects = storedProjects.map((proj) =>
      proj.name === initialProject.name ? { ...proj, name: projectName, description } : proj
    );
    localStorage.setItem("projects", JSON.stringify(updatedProjects));
  }, [projectName, description]);

  return (
    <div className="workspace-container">
      <PanelGroup direction="horizontal">
        
        {/* Left Side: Canvas with Grid and Rulers */}
        <Panel defaultSize={70} minSize={50} className="canvas-area">
          <CanvasGrid />
        </Panel>

        {/* Resizer Handle */}
        <PanelResizeHandle className="resizer" />

        {/* Right Side: Sidebar */}
        <Panel defaultSize={30} minSize={20} maxSize={50} className="sidebar">
          <div className="sidebar-content">
            <h3>Edit Project</h3>

            <label>Project Name:</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="input-field"
            />

            <label>Project Description:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              rows="3"
            ></textarea>

            <button onClick={() => navigate("/")} className="back-button">Back to Home</button>
          </div>
        </Panel>

      </PanelGroup>
    </div>
  );
};

export default Workspace;
