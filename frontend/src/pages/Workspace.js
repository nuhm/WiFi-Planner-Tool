import React, { useEffect, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useLocation, useNavigate } from "react-router-dom";
import CanvasGrid from "../components/CanvasGrid";
import "../styles/Workspace.css";

const Workspace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: project } = location;
  const [projectName, setProjectName] = useState(project.name);
  const [projectDescription, setProjectDescription] = useState(project.description || "");

  const [isProjectSidebarOpen, setIsProjectSidebarOpen] = useState(false);

  const [isPanning, setIsPanning] = useState(false);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [isDeletingNode, setIsDeletingNode] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  const [nodes, setNodes] = useState([]);
  const [walls, setWalls] = useState([]);

  const [selectedNode, setSelectedNode] = useState(null);
  const [lastAddedNode, setLastAddedNode] = useState(null);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const allProjects = JSON.parse(localStorage.getItem("projects")) || [];
    const updatedProjects = allProjects.map(p =>
      p.name === projectName
        ? { ...p, name: projectName, description: projectDescription }
        : p
    );

    localStorage.setItem("projects", JSON.stringify(updatedProjects));
  }, [projectName, projectDescription]);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem(`canvasData-${projectName}`);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setNodes(parsedData.nodes || []); // Set the nodes from saved data
      setWalls(parsedData.walls || []); // Set the walls from saved data
      console.log("Loaded saved data:", parsedData);
      setIsLoaded(true);
    } else {
      setIsLoaded(true);
    }
  }, [projectName]); // Empty dependency array to only run on mount

  // Auto-save nodes and walls to localStorage whenever they change and data has been loaded
  useEffect(() => {
    if (isLoaded) {
      const data = { nodes, walls };
      localStorage.setItem(`canvasData-${projectName}`, JSON.stringify(data));
    }
  }, [isLoaded, nodes, walls, projectName]); // Auto-save runs only after loading is complete

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

          <CanvasGrid
            isPanning = {isPanning}
            isAddingNode={isAddingNode}
            isDeletingNode={isDeletingNode}
            isSelecting={isSelecting}
            nodes={nodes}
            setNodes={setNodes}
            walls={walls}
            setWalls={setWalls}
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            lastAddedNode={lastAddedNode}
            setLastAddedNode={setLastAddedNode}
          />

          <div className="RightButtonsContainer">
            {!isProjectSidebarOpen && (
              <button className="project-settings-button" onClick={() => setIsProjectSidebarOpen(true)}>
                ⚙️ Project Settings
              </button>
            )}
          </div>
        </Panel>

        {/* Resizer Handle (Only visible when any sidebar is open) */}
        {(isProjectSidebarOpen) && <PanelResizeHandle className="resizer" />}

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
              <input type="text" className="input-field" defaultValue={project.name} onChange={(e) => setProjectName(e.target.value)} />

              <label>Project Description:</label>
              <textarea className="input-field" rows="6" defaultValue={project.description} onChange={(e) => setProjectDescription(e.target.value)} />
            </div>
          </Panel>
        )}
      </PanelGroup>
    </div>
  );
};

export default Workspace;
