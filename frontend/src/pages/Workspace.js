import React, { useEffect, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useLocation, useNavigate } from "react-router-dom";
import Canvas from "../components/Canvas/Canvas";
import { useToast } from '../components/Toast/ToastContext';
import "../styles/Workspace.css";

/**
 * Workspace is the main project editing area.
 * It manages the canvas, tool modes, project data, and sidebars for settings/configuration.
 * Loads and saves project/canvas data to localStorage.
 */
const Workspace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: project } = location;
  const projectId = project.id;
  // --- Project data state ---
  const [projectName, setProjectName] = useState(project.name);
  const [projectDescription, setProjectDescription] = useState(project.description || "");
  const [isLoaded, setIsLoaded] = useState(false);

  // --- Sidebar visibility state ---
  const [isProjectSidebarOpen, setIsProjectSidebarOpen] = useState(false);
  const [isConfigSidebarOpen, setIsConfigSidebarOpen] = useState(false);

  // --- Tool mode state ---
  const [mode, setMode] = useState({
    isPanning: false,
    isAddingNode: false,
    isSelecting: false,
    isTestingSignal: false,
    isPlacingAP: false,
  });

  const toggleMode = (key) => {
    setMode((prevMode) => ({
      ...prevMode,
      [key]: !prevMode[key],
    }));
  };

  // --- Canvas element state ---
  const [nodes, setNodes] = useState([]);
  const [walls, setWalls] = useState([]);
  const [accessPoints, setAccessPoints] = useState([]);

  // --- Selection state ---
  const [lastAddedNode, setLastAddedNode] = useState(null);
  const [selected, setSelected] = useState({
    node: null,
    wall: null,
    ap: null,
  });

  const clearSelected = () => {
    setSelected({ node: null, wall: null, ap: null });
    setLastAddedNode(null);
  };

  const { showToast } = useToast();

  // Show toast when wall tool is active
  useEffect(() => {
    if (mode.isAddingNode) {
      showToast('Wall Tool active — Shift+Click a wall node to delete');
    }
  }, [mode.isAddingNode, showToast]);

  // Persist project name/description to localStorage
  useEffect(() => {
    const allProjects = JSON.parse(localStorage.getItem("projects")) || [];
    const now = new Date().toISOString();
    const updatedProjects = allProjects.map(p =>
      p.id === projectId
        ? { ...p, name: projectName, description: projectDescription, lastEdited: now }
        : p
    );
    localStorage.setItem("projects", JSON.stringify(updatedProjects));
  }, [projectName, projectDescription, projectId]);

  // Load canvas data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(`canvasData-${projectId}`);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setNodes(parsedData.nodes || []);
      setWalls(parsedData.walls || []);
      setAccessPoints(parsedData.accessPoints || []);
    }
    setIsLoaded(true);
  }, [projectId]);

  // Auto-save canvas data to localStorage after load and on changes
  useEffect(() => {
    if (isLoaded) {
      const data = { nodes, walls, accessPoints };
      localStorage.setItem(`canvasData-${projectId}`, JSON.stringify(data));
      // Update lastEdited timestamp
      const allProjects = JSON.parse(localStorage.getItem("projects")) || [];
      const now = new Date().toISOString();
      const updatedProjects = allProjects.map(p =>
        p.id === projectId ? { ...p, lastEdited: now } : p
      );
      localStorage.setItem("projects", JSON.stringify(updatedProjects));
    }
  }, [isLoaded, nodes, walls, accessPoints, projectId]);

  // Clear all grid/canvas data
  const clearGrid = () => {
    const confirmClear = window.confirm("Are you sure you want to clear all walls, nodes, and access points?");
    if (!confirmClear) return;
    setNodes([]);
    setWalls([]);
    setAccessPoints([]);
    deselectButtons();
    clearSelected();
  };

  // Deselect all toolbar tool modes
  const deselectButtons = () => {
    setMode({
      isPanning: false,
      isAddingNode: false,
      isSelecting: false,
      isTestingSignal: false,
      isPlacingAP: false,
    });
  };

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
                  className={`toolbar-button ${mode.isPanning ? "active" : ""}`} 
                  onClick={() => {
                    const canvas = document.querySelector('.grid-canvas');
                    canvas.style.cursor = "grabbing";
                    deselectButtons();
                    toggleMode("isPanning");
                  }}
              >
                  ✖️ Pan Tool
              </button>

              <button 
                  className={`toolbar-button ${mode.isSelecting ? "active" : ""}`} 
                  onClick={() => {
                    const canvas = document.querySelector('.grid-canvas');
                    canvas.style.cursor = "pointer";
                    deselectButtons();
                    toggleMode("isSelecting");
                  }}
              >
                  ✖️ Selector Tool
              </button>

              <button 
                  className={`toolbar-button ${mode.isAddingNode ? "active" : ""}`} 
                  onClick={() => {
                    const canvas = document.querySelector('.grid-canvas');
                    canvas.style.cursor = "pointer";
                    deselectButtons();
                    toggleMode("isAddingNode");
                  }}
              >
                  🧱 Wall Tool
              </button>

              <button 
                  className={`toolbar-button ${mode.isPlacingAP ? "active" : ""}`} 
                  onClick={() => {
                    const canvas = document.querySelector('.grid-canvas');
                    canvas.style.cursor = "pointer";
                    deselectButtons();
                    toggleMode("isPlacingAP");
                  }}
              >
                  ➕ AP Tool
              </button>

              <button 
                  className={`toolbar-button ${mode.isTestingSignal ? "active" : ""}`} 
                  onClick={() => {
                    const canvas = document.querySelector('.grid-canvas');
                    canvas.style.cursor = "pointer";
                    deselectButtons();
                    toggleMode("isTestingSignal");
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
            <button className="canvas-sidebar-button canvas-overlay-button" onClick={() => {
                setIsProjectSidebarOpen(true);
                setIsConfigSidebarOpen(false);
              }}>
              ⚙️ Project Settings
            </button>

            <button className="canvas-sidebar-button canvas-overlay-button" onClick={() => {
                setIsConfigSidebarOpen(true);
                setIsProjectSidebarOpen(false);
              }}>
              ⚙️ Configuration
            </button>
          </div>

          <Canvas
            mode={mode}
            nodes={nodes}
            setNodes={setNodes}
            walls={walls}
            setWalls={setWalls}
            selected={selected}
            setSelected={setSelected}
            accessPoints={accessPoints}
            setAccessPoints={setAccessPoints}
            openConfigSidebar={() => setIsConfigSidebarOpen(true)}
            lastAddedNode={lastAddedNode}
            setLastAddedNode={setLastAddedNode}
          />
        </Panel>

        {/* Resizer Handle: Only visible when any sidebar is open */}
        {(isProjectSidebarOpen || isConfigSidebarOpen) && <PanelResizeHandle className="resizer" />}

        {/* Right Side: Project Settings or Configuration Sidebar */}
        {(isProjectSidebarOpen || isConfigSidebarOpen) && (
          <Panel defaultSize={20} minSize={20} maxSize={50} className="sidebar">
            <div className="sidebar-content">
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

              {isConfigSidebarOpen && selected.node == null && selected.wall == null && selected.ap == null && (
                <>
                  <h3>Configuration Panel</h3>
                  <p>Select an item with the selector tool to view its configuration.</p>
                </>
              )}
              
              {isConfigSidebarOpen && selected.node && (
                <>
                  <h3>Node Configuration</h3>
                  <p>Node ID: {selected.node.id}</p>
                </>
              )}

              {isConfigSidebarOpen && selected.wall && (
                <>
                  <h3>Wall Configuration</h3>
                  <p>Wall ID: {selected.wall.id}</p>

                  <label>Type:</label>
                  <select
                    className="sidebar-input-field"
                    value={selected.wall.config?.type || "wall"}
                    onChange={(e) => {
                      const type = e.target.value;
                      if (!selected.wall) return;

                      setWalls(prevWalls => {
                        const updated = prevWalls.map(w =>
                          w.id === selected.wall.id ? { ...w, config: { ...w.config, type } } : w
                        );
                        const updatedWall = updated.find(w => w.id === selected.wall.id);
                        setSelected(prev => ({ ...prev, wall: updatedWall }));
                        return updated;
                      });

                    }}
                  >
                    <option value="wall">Wall</option>
                    <option value="doorway">Doorway</option>
                    <option value="window">Window</option>
                  </select>

                  <label>Material:</label>
                  <select
                    className="sidebar-input-field"
                    value={selected.wall.config?.material || "drywall"}
                    onChange={(e) => {
                      const material = e.target.value;
                      if (!selected.wall) return;

                      setWalls(prevWalls => {
                        const updated = prevWalls.map(w =>
                          w.id === selected.wall.id ? { ...w, config: { ...w.config, material } } : w
                        );
                        const updatedWall = updated.find(w => w.id === selected.wall.id);
                        setSelected(prev => ({ ...prev, wall: updatedWall }));
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
                    value={selected.wall.config?.thickness || 10}
                    min={1}
                    max={100}
                    onChange={(e) => {
                      const thickness = parseInt(e.target.value);
                      if (!selected.wall) return;

                      setWalls(prevWalls => {
                        const updated = prevWalls.map(w =>
                          w.id === selected.wall.id ? { ...w, config: { ...w.config, thickness } } : w
                        );
                        setSelected(prev => ({ ...prev, wall: selected.wall }));
                        return updated;
                      });

                    }}
                  />
                  
                  <label>Signal Loss: (dB):</label>
                  <input
                    readOnly
                    type="number"
                    className="sidebar-input-field"
                    value={selected.wall.config?.signalLoss || 1}
                    min={0}
                    max={100}
                    onChange={(e) => {
                      const signalLoss = parseInt(e.target.value);
                      if (!selected.wall) return;

                      setWalls(prevWalls => {
                        const updated = prevWalls.map(w =>
                          w.id === selected.wall.id ? { ...w, config: { ...w.config, signalLoss } } : w
                        );
                        setSelected(prev => ({ ...prev, wall: selected.wall }));
                        return updated;
                      });

                    }}
                  />
                </>
              )}

              {isConfigSidebarOpen && selected.ap && (
                <>
                  <h3>Access Point Configuration</h3>
                  <p>AP ID: {selected.ap.id}</p>
                  <input
                    type="text"
                    className="sidebar-input-field"
                    value={selected.ap.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      if (!selected.ap) return;

                      setAccessPoints(prev => {
                        const updated = prev.map(ap =>
                          ap.id === selected.ap?.id
                            ? { ...ap, name: newName }
                            : ap
                        );
                        const newAP = updated.find(ap => ap.id === selected.ap?.id);
                        setSelected(prev => ({ ...prev, ap: newAP ?? null })); // fallback to null if not found
                        return updated;
                      });
                    }}
                  />
                  <p>X: {selected.ap.x}, Y: {selected.ap.y}</p>
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
