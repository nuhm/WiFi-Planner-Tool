import React, { useEffect, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useLocation, useNavigate } from "react-router-dom";
import CanvasGrid from "../components/CanvasGrid";
import "../styles/Workspace.css";

const Workspace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: project } = location;
  const projectId = project.id;
  const [projectName, setProjectName] = useState(project.name);
  const [projectDescription, setProjectDescription] = useState(project.description || "");

  const [isProjectSidebarOpen, setIsProjectSidebarOpen] = useState(false);
  const [isAPConfigSidebarOpen, setIsAPConfigSidebarOpen] = useState(false);

  const [isPanning, setIsPanning] = useState(false);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [isDeletingNode, setIsDeletingNode] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  const [isPlacingAP, setIsPlacingAP] = useState(false);

  const [nodes, setNodes] = useState([]);
  const [walls, setWalls] = useState([]);

  const [selectedAP, setSelectedAP] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [lastAddedNode, setLastAddedNode] = useState(null);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const allProjects = JSON.parse(localStorage.getItem("projects")) || [];
    const now = new Date().toISOString();
    const updatedProjects = allProjects.map(p =>
      p.id === projectId
        ? { ...p, name: projectName, description: projectDescription, lastEdited: now }
        : p
    );

    localStorage.setItem("projects", JSON.stringify(updatedProjects));
  }, [projectName, projectDescription]);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem(`canvasData-${projectId}`);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setNodes(parsedData.nodes || []);
      setWalls(parsedData.walls || []);
      setIsLoaded(true);
    } else {
      setIsLoaded(true);
    }
  }, [projectId]); // Empty dependency array to only run on mount

  // Auto-save nodes and walls to localStorage whenever they change and data has been loaded
  useEffect(() => {
    if (isLoaded) {
      const data = { nodes, walls };
      localStorage.setItem(`canvasData-${projectId}`, JSON.stringify(data));

      const allProjects = JSON.parse(localStorage.getItem("projects")) || [];
      const now = new Date().toISOString();
      const updatedProjects = allProjects.map(p =>
        p.id === projectId ? { ...p, lastEdited: now } : p
      );

      localStorage.setItem("projects", JSON.stringify(updatedProjects));
    }
  }, [isLoaded, nodes, walls, projectId]);

  const clearSelectedNode = () => {
    setSelectedNode(null);
    setLastAddedNode(null);
  };

  const clearGrid = () => {
    setNodes([]);
    setWalls([]);
    deselectButtons();
    clearSelectedNode();
  };

  const deselectButtons = () => {
    setIsAddingNode(false);
    setIsDeletingNode(false);
    setIsPlacingAP(false);
    setIsPanning(false);
    setIsSelecting(false);
  }

  return (
    <div className="workspace-container">
      <PanelGroup direction="horizontal">
        
        {/* Left Side: Canvas */}
        <Panel 
          defaultSize={isProjectSidebarOpen ? 70 : 100} 
          minSize={50} 
          className="canvas-area"
        >
          <div className="LeftButtonsContainer">
            <div className="toolbar">
              <button className="toolbar-button negative-button" onClick={() => navigate("/")}>
                ✖ Exit
              </button>

              <button 
                  className={`toolbar-button ${isPanning ? "active" : ""}`} 
                  onClick={() => {
                    const canvas = document.querySelector('.grid-canvas');
                    canvas.style.cursor = "grabbing";
                    deselectButtons();
                    setIsPanning(!isPanning);
                  }}
              >
                  ✖️ Panning Tool
              </button>

              <button 
                  className={`toolbar-button ${isAddingNode ? "active" : ""}`} 
                  onClick={() => {
                    const canvas = document.querySelector('.grid-canvas');
                    canvas.style.cursor = "pointer";
                    deselectButtons();
                    setIsAddingNode(!isAddingNode);
                  }}
              >
                  ➕ Add Node
              </button>
              
              <button 
                  className={`toolbar-button ${isDeletingNode ? "active" : ""}`} 
                  onClick={() => {
                    const canvas = document.querySelector('.grid-canvas');
                    canvas.style.cursor = "pointer";
                    deselectButtons();
                    setIsDeletingNode(!isDeletingNode);
                  }}
              >
                  🗑️ Delete Node
              </button>

              <button 
                  className={`toolbar-button ${isPlacingAP ? "active" : ""}`} 
                  onClick={() => {
                    const canvas = document.querySelector('.grid-canvas');
                    canvas.style.cursor = "pointer";
                    deselectButtons();
                    setIsPlacingAP(!isPlacingAP);
                  }}
              >
                  ➕ AP Tool
              </button>

              <button 
                  className={`toolbar-button ${isSelecting ? "active" : ""}`} 
                  onClick={() => {
                    const canvas = document.querySelector('.grid-canvas');
                    canvas.style.cursor = "pointer";
                    deselectButtons();
                    setIsSelecting(!isSelecting);
                  }}
              >
                  ✖️ Selector Tool
              </button>
              
              <button 
                  className="toolbar-button negative-button" 
                  onClick={() => {
                    const canvas = document.querySelector('.grid-canvas');
                    canvas.style.cursor = "pointer";
                    clearGrid();
                  }}
              >
                  🧹 Clear
              </button>
            </div>
          </div>

          <div className="RightButtonsContainer">
            <button className="project-settings-button" onClick={() => {
                setIsProjectSidebarOpen(true);
                setIsAPConfigSidebarOpen(false);
              }}>
              ⚙️ Project Settings
            </button>

            <button className="project-settings-button" onClick={() => {
                setIsAPConfigSidebarOpen(true);
                setIsProjectSidebarOpen(false);
              }}>
              ⚙️ AP Configuration
            </button>
          </div>

          <CanvasGrid
            isPanning={isPanning}
            isAddingNode={isAddingNode}
            isDeletingNode={isDeletingNode}
            isSelecting={isSelecting}
            isPlacingAP={isPlacingAP}
            nodes={nodes}
            setNodes={setNodes}
            walls={walls}
            setWalls={setWalls}
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            lastAddedNode={lastAddedNode}
            setLastAddedNode={setLastAddedNode}
            selectedAP={selectedAP}
            setSelectedAP={setSelectedAP}
            onSelectAP={() => setIsAPConfigSidebarOpen(true)}
          />
        </Panel>

        {/* Resizer Handle (Only visible when any sidebar is open) */}
        {(isProjectSidebarOpen || isAPConfigSidebarOpen) && <PanelResizeHandle className="resizer" />}

        {/* 🔥 Right Side: Project Settings or AP Configuration Sidebar */}
        {(isProjectSidebarOpen || isAPConfigSidebarOpen) && (
          <Panel defaultSize={20} minSize={20} maxSize={50} className="sidebar">
            <div className="sidebar-content">
              
              {/* 🔥 Close Sidebar Button */}
              <button className="close-sidebar-button" onClick={() => {
                setIsProjectSidebarOpen(false);
                setIsAPConfigSidebarOpen(false);
              }}>
                ✖ Close
              </button>

              {isProjectSidebarOpen && (
                <>
                  <h3>Project Settings</h3>
                  <label>Project Name:</label>
                  <input type="text" className="sidebar-input-field" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                  <label>Description:</label>
                  <textarea className="sidebar-input-field" rows="6" value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} />
                </>
              )}

              {isAPConfigSidebarOpen && selectedAP == null && (
                <>
                  <h3>Access Point Configuration</h3>
                  <p>Select an access point to view its configuration.</p>
                </>
              )}

              {isAPConfigSidebarOpen && selectedAP && (
                <>
                  <h3>Access Point Configuration</h3>
                  <p>X: {selectedAP.x}, Y: {selectedAP.y}</p>
                  {/* Add editable fields if needed */}
                </>
              )}
            </div>
          </Panel>
        )}
      </PanelGroup>
    </div>
  );
};

export default Workspace;
