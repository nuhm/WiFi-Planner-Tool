import React, { useEffect, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useLocation, useNavigate } from "react-router-dom";
import CanvasGrid from "../components/CanvasGrid";
import "../styles/Workspace.css";

const Workspace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: project } = location;

  const [isProjectSidebarOpen, setIsProjectSidebarOpen] = useState(false);
  const [isBlueprintSidebarOpen, setIsBlueprintSidebarOpen] = useState(false);

  const [isPanning, setIsPanning] = useState(false);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [isDeletingNode, setIsDeletingNode] = useState(false);
  const [isWallBuilder, setIsWallBuilder] = useState(false);

  const [nodes, setNodes] = useState([]);
  const [walls, setWalls] = useState([]);

  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem(`canvasData-${project.name}`);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setNodes(parsedData.nodes || []); // Set the nodes from saved data
      setWalls(parsedData.walls || []); // Set the walls from saved data
      console.log("Loaded saved data:", parsedData);
      setIsLoaded(true);
    } else {
      setIsLoaded(true);
    }
  }, []); // Empty dependency array to only run on mount

  // Auto-save nodes and walls to localStorage whenever they change and data has been loaded
  useEffect(() => {
    if (isLoaded) {
      const data = { nodes, walls };
      localStorage.setItem(`canvasData-${project.name}`, JSON.stringify(data));
    }
  }, [isLoaded, nodes, walls]); // Auto-save runs only after loading is complete

  const clearGrid = () => {
    setNodes([]);
    setWalls([]);
    deselectButtons();
  };

  const deselectButtons = () => {
    setIsAddingNode(false);
    setIsDeletingNode(false);
    setIsPanning(false);
    setIsWallBuilder(false);
  }

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
          <CanvasGrid 
            isSidebarOpen={isProjectSidebarOpen || isBlueprintSidebarOpen} 
            sidebarWidth={300}
            isPanning = {isPanning}
            isAddingNode={isAddingNode}
            isDeletingNode={isDeletingNode}
            isWallBuilder={isWallBuilder}
            nodes={nodes}
            setNodes={setNodes}
            walls={walls}
            setWalls={setWalls}
            projectName={project.name}
          />
          
          <div>
            {/* 🔥 Floating "Project Settings" Button */}
            {!isProjectSidebarOpen && !isBlueprintSidebarOpen && (
              <button className="project-settings-button" onClick={() => setIsProjectSidebarOpen(true)}>
                ⚙️ Project Settings
              </button>
            )}

            {/* 🔥 Floating "Blueprint Editor" Button (Below Project Settings) */}
            {!isProjectSidebarOpen && !isBlueprintSidebarOpen && (
              <button
                className="blueprint-editor-button"
                onClick={() => setIsBlueprintSidebarOpen(true)}
              >
                📐 Blueprint Editor
              </button>
            )}
          </div>
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
              <textarea className="input-field" rows="6" />
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
              
              {/* 📌 Toolbar for Wall Nodes */}
              <div className="toolbar">
                <button 
                    className={`toolbar-button ${isPanning ? "active" : ""}`} 
                    onClick={() => {
                        deselectButtons();
                        setIsPanning(!isPanning);
                    }}
                >
                    ✖️ Panning Tool
                </button>
                <button 
                    className={`toolbar-button ${isAddingNode ? "active" : ""}`} 
                    onClick={() => {
                        deselectButtons();
                        setIsAddingNode(!isAddingNode);
                    }}
                >
                    ➕ Add Node
                </button>
                
                <button 
                    className={`toolbar-button ${isDeletingNode ? "active" : ""}`} 
                    onClick={() => {
                        deselectButtons();
                        setIsDeletingNode(!isDeletingNode);
                    }}
                >
                    🗑️ Delete Node
                </button>

                <button 
                    className={`toolbar-button ${isWallBuilder ? "active" : ""}`} 
                    onClick={() => {
                      deselectButtons();
                      setIsWallBuilder(!isWallBuilder);
                  }}
                >
                    🧱 Wall Tool
                </button>
                
                <button 
                    className="toolbar-button clear" 
                    onClick={clearGrid}
                >
                    🧹 Clear
                </button>

              </div>
            </div>
          </Panel>
        )}
      </PanelGroup>
    </div>
  );
};

export default Workspace;
