import React, { useEffect, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useLocation, useNavigate } from "react-router-dom";
import CanvasGrid from "../components/CanvasGrid";

import { useToast } from '../components/ToastContext';
import "../styles/Workspace.css";

const Workspace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: project } = location;
  const projectId = project.id;
  const [projectName, setProjectName] = useState(project.name);
  const [projectDescription, setProjectDescription] = useState(project.description || "");

  const [isProjectSidebarOpen, setIsProjectSidebarOpen] = useState(false);
  const [isConfigSidebarOpen, setIsConfigSidebarOpen] = useState(false);

  const [isPanning, setIsPanning] = useState(false);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isTestingSignal, setIsTestingSignal] = useState(false);

  const [isPlacingAP, setIsPlacingAP] = useState(false);

  const [nodes, setNodes] = useState([]);
  const [walls, setWalls] = useState([]);

  const [selectedWall, setSelectedWall] = useState(null);

  const [selectedAP, setSelectedAP] = useState(null);
  const [accessPoints, setAccessPoints] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [lastAddedNode, setLastAddedNode] = useState(null);

  const [isLoaded, setIsLoaded] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    if (isAddingNode) {
      showToast('Wall Tool active — Shift+Click a wall node to delete');
    }
  }, [isAddingNode]);

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
      setAccessPoints(parsedData.accessPoints || []);
      setIsLoaded(true);
    } else {
      setIsLoaded(true);
    }
  }, [projectId]); // Empty dependency array to only run on mount

  // Auto-save nodes, walls, and accessPoints to localStorage whenever they change and data has been loaded
  useEffect(() => {
    if (isLoaded) {
      const data = { nodes, walls, accessPoints };
      localStorage.setItem(`canvasData-${projectId}`, JSON.stringify(data));

      const allProjects = JSON.parse(localStorage.getItem("projects")) || [];
      const now = new Date().toISOString();
      const updatedProjects = allProjects.map(p =>
        p.id === projectId ? { ...p, lastEdited: now } : p
      );

      localStorage.setItem("projects", JSON.stringify(updatedProjects));
    }
  }, [isLoaded, nodes, walls, accessPoints, projectId]);

  const clearSelectedNode = () => {
    setSelectedNode(null);
    setLastAddedNode(null);
  };

  const clearGrid = () => {
    const confirmClear = window.confirm("Are you sure you want to clear all walls, nodes, and access points?");
    if (!confirmClear) return;

    setNodes([]);
    setWalls([]);
    setAccessPoints([]);
    deselectButtons();
    clearSelectedNode();
  };

  const deselectButtons = () => {
    setIsAddingNode(false);
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
                  ✖️ Pan Tool
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
                  className={`toolbar-button ${isAddingNode ? "active" : ""}`} 
                  onClick={() => {
                    const canvas = document.querySelector('.grid-canvas');
                    canvas.style.cursor = "pointer";
                    deselectButtons();
                    setIsAddingNode(!isAddingNode);
                  }}
              >
                  🧱 Wall Tool
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
                  className={`toolbar-button ${isTestingSignal ? "active" : ""}`} 
                  onClick={() => {
                    const canvas = document.querySelector('.grid-canvas');
                    canvas.style.cursor = "pointer";
                    deselectButtons();
                    setIsTestingSignal(!isTestingSignal);
                  }}
              >
                  ➕ Tester Tool
              </button>
              
              <button 
                  className="toolbar-button negative-button" 
                  onClick={() => {
                    const canvas = document.querySelector('.grid-canvas');
                    canvas.style.cursor = "pointer";
                    clearGrid();
                  }}
              >
                  🗑️ Clear Grid
              </button>
            </div>
          </div>

          <div className="RightButtonsContainer">
            <button className="project-settings-button" onClick={() => {
                setIsProjectSidebarOpen(true);
                setIsConfigSidebarOpen(false);
              }}>
              ⚙️ Project Settings
            </button>

            <button className="project-settings-button" onClick={() => {
                setIsConfigSidebarOpen(true);
                setIsProjectSidebarOpen(false);
              }}>
              ⚙️ Configuration
            </button>
          </div>

          <CanvasGrid
            isPanning={isPanning}
            isAddingNode={isAddingNode}
            isSelecting={isSelecting}
            isPlacingAP={isPlacingAP}
            isTestingSignal={isTestingSignal}
            nodes={nodes}
            setNodes={setNodes}
            walls={walls}
            setWalls={setWalls}
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            lastAddedNode={lastAddedNode}
            setLastAddedNode={setLastAddedNode}
            selectedWall={selectedWall}
            setSelectedWall={setSelectedWall}
            selectedAP={selectedAP}
            setSelectedAP={setSelectedAP}
            accessPoints={accessPoints}
            setAccessPoints={setAccessPoints}
            openConfigSidebar={() => setIsConfigSidebarOpen(true)}
          />
        </Panel>

        {/* Resizer Handle (Only visible when any sidebar is open) */}
        {(isProjectSidebarOpen || isConfigSidebarOpen) && <PanelResizeHandle className="resizer" />}

        {/* 🔥 Right Side: Project Settings or Configuration Sidebar */}
        {(isProjectSidebarOpen || isConfigSidebarOpen) && (
          <Panel defaultSize={20} minSize={20} maxSize={50} className="sidebar">
            <div className="sidebar-content">
              
              {/* 🔥 Close Sidebar Button */}
              <button className="close-sidebar-button" onClick={() => {
                setIsProjectSidebarOpen(false);
                setIsConfigSidebarOpen(false);
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

              {isConfigSidebarOpen && selectedAP == null && selectedNode == null && selectedWall == null && (
                <>
                  <h3>Configuration Panel</h3>
                  <p>Select an item with the selector tool to view its configuration.</p>
                </>
              )}
              
              {isConfigSidebarOpen && selectedNode && (
                <>
                  <h3>Node Configuration</h3>
                  <p>Node ID: {selectedNode.id}</p>
                </>
              )}

              {isConfigSidebarOpen && selectedWall && (
                <>
                  <h3>Wall Configuration</h3>
                  <p>Wall ID: {selectedWall.id}</p>
                  <label>Material:</label>
                  <select
                    className="sidebar-input-field"
                    value={selectedWall.config?.material || "drywall"}
                    onChange={(e) => {
                      const material = e.target.value;
                      if (!selectedWall) return;

                      setWalls(prevWalls => {
                        const updated = prevWalls.map(w =>
                          w.id === selectedWall.id ? { ...w, config: { ...w.config, material } } : w
                        );
                        const updatedWall = updated.find(w => w.id === selectedWall.id);
                        setSelectedWall(updatedWall);
                        return updated;
                      });

                    }}
                  >
                    <option value="drywall">Drywall</option>
                    <option value="concrete">Concrete</option>
                    <option value="glass">Glass</option>
                  </select>

                  <label>Thickness (cm):</label>
                  <input
                    type="number"
                    className="sidebar-input-field"
                    value={selectedWall.config?.thickness || 10}
                    min={1}
                    max={100}
                    onChange={(e) => {
                      const thickness = parseInt(e.target.value);
                      if (!selectedWall) return;

                      setWalls(prevWalls => {
                        const updated = prevWalls.map(w =>
                          w.id === selectedWall.id ? { ...w, config: { ...w.config, thickness } } : w
                        );
                        setSelectedWall(selectedWall);
                        return updated;
                      });

                    }}
                  />
                </>
              )}

              {isConfigSidebarOpen && selectedAP && (
                <>
                  <h3>Access Point Configuration</h3>
                  <input
                    type="text"
                    className="sidebar-input-field"
                    value={selectedAP.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      if (!selectedAP) return;

                      setAccessPoints(prev => {
                        const updated = prev.map(ap =>
                          ap.x === selectedAP.x && ap.y === selectedAP.y
                            ? { ...ap, name: newName }
                            : ap
                        );
                        const newAP = updated.find(ap => ap.x === selectedAP.x && ap.y === selectedAP.y);
                        setSelectedAP(newAP);
                        return updated;
                      });

                    }}
                  />
                  <p>X: {selectedAP.x}, Y: {selectedAP.y}</p>
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
