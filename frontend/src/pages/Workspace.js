import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import CanvasGrid from "../components/CanvasGrid";
import "../styles/Workspace.css";

const Workspace = () => {
  const navigate = useNavigate();
  const [isProjectSidebarOpen, setIsProjectSidebarOpen] = useState(false);
  const [isBlueprintSidebarOpen, setIsBlueprintSidebarOpen] = useState(false);

  return (
    <div className="workspace-container">
      
      {/* 🔥 Exit Button (Top-Left Corner) */}
      <button className="exit-button" onClick={() => navigate("/")}>
        ✖ Exit
      </button>

      <PanelGroup direction="horizontal">
        
        {/* Left Side: Canvas */}
        <Panel 
          defaultSize={isProjectSidebarOpen || isBlueprintSidebarOpen ? 70 : 100} 
          minSize={50} 
          className="canvas-area"
        >
          <CanvasGrid />

          {/* 🔥 Floating "Project Settings" Button */}
          {!isProjectSidebarOpen && !isBlueprintSidebarOpen && (
            <button className="project-settings-button" onClick={() => setIsProjectSidebarOpen(true)}>
              Project Settings
            </button>
          )}

          {/* 🔥 Floating "Blueprint Editor" Button (Below Project Settings) */}
          {!isProjectSidebarOpen && !isBlueprintSidebarOpen && (
            <button
              className="blueprint-editor-button"
              onClick={() => setIsBlueprintSidebarOpen(true)}
            >
              Blueprint Editor
            </button>
          )}
        </Panel>

        {/* Resizer Handle (Only visible when any sidebar is open) */}
        {(isProjectSidebarOpen || isBlueprintSidebarOpen) && <PanelResizeHandle className="resizer" />}

        {/* 🔥 Right Side: Project Settings Sidebar */}
        {isProjectSidebarOpen && (
          <Panel defaultSize={30} minSize={20} maxSize={50} className="sidebar">
            <div className="sidebar-content">
              
              {/* 🔥 Close Sidebar Button */}
              <button className="close-sidebar-button" onClick={() => setIsProjectSidebarOpen(false)}>
                ✖ Close
              </button>

              <h3>Project Settings</h3>

              <label>Project Name:</label>
              <input type="text" className="input-field" />

              <label>Project Description:</label>
              <textarea className="input-field" rows="3"></textarea>

              <button onClick={() => navigate("/")} className="back-button">Back to Home</button>
            </div>
          </Panel>
        )}

        {/* 🔥 Right Side: Blueprint Editor Sidebar */}
        {isBlueprintSidebarOpen && (
          <Panel defaultSize={30} minSize={20} maxSize={50} className="sidebar">
            <div className="sidebar-content">
              
              {/* 🔥 Close Sidebar Button */}
              <button className="close-sidebar-button" onClick={() => setIsBlueprintSidebarOpen(false)}>
                ✖ Close
              </button>

              <h3>Blueprint Editor</h3>
              
              <label>Wall Length:</label>
              <input type="number" className="input-field" placeholder="Enter length" />

              <label>Wall Material:</label>
              <select className="input-field">
                <option>Concrete</option>
                <option>Brick</option>
                <option>Wood</option>
              </select>

              <button className="add-wall-button">Add Wall</button>
            </div>
          </Panel>
        )}

      </PanelGroup>
    </div>
  );
};

export default Workspace;
