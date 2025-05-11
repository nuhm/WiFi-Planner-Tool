import React, { useEffect, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useLocation, useNavigate } from "react-router-dom";
import Canvas from "../components/Canvas/Canvas";
import { useToast } from '../components/Toast/ToastContext';
import "../styles/Workspace.css";
import { MATERIALS } from "../constants/config";

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

  const updateWallConfig = (key, value) => {
    if (!selected.wall) return;

    setWalls(prev => {
      const updated = prev.map(wall =>
        wall.id === selected.wall.id
          ? {
              ...wall,
              config: {
                ...wall.config,
                [key]: value
              }
            }
          : wall
      );

      const newWall = updated.find(wall => wall.id === selected.wall.id);
      setSelected(prev => ({ ...prev, wall: newWall ?? null }));

      return updated;
    });
  };

  const updateAPConfig = (key, value) => {
    if (!selected.ap) return;
    setAccessPoints(prev => {
      const updated = prev.map(ap =>
        ap.id === selected.ap.id
          ? {
              ...ap,
              config: {
                ...ap.config,
                [key]: value
              }
            }
          : ap
      );
      const newAP = updated.find(ap => ap.id === selected.ap.id);
      setSelected(prev => ({ ...prev, ap: newAP ?? null }));
      return updated;
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
                setIsConfigSidebarOpen(false);
                setIsProjectSidebarOpen(true);
              }}>
              ⚙️ Project Settings
            </button>

            <button className="canvas-sidebar-button canvas-overlay-button" onClick={() => {
                setIsProjectSidebarOpen(false);
                setIsConfigSidebarOpen(true);
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
            openConfigSidebar={() => {
              setIsProjectSidebarOpen(false);
              setIsConfigSidebarOpen(true);
            }}
            lastAddedNode={lastAddedNode}
            setLastAddedNode={setLastAddedNode}
          />
        </Panel>

        {/* Resizer Handle: Only visible when any sidebar is open */}
        {(isProjectSidebarOpen || isConfigSidebarOpen) && <PanelResizeHandle className="resizer" />}

        {/* Right Side: Project Settings or Configuration Sidebar */}
        {(isProjectSidebarOpen || isConfigSidebarOpen) && (
          <Panel defaultSize={20} minSize={20} maxSize={50} className="sidebar"  style={{ overflowY: "auto" }}>
            <div className="sidebar-content">
              

              {isProjectSidebarOpen && (
                <>
                  <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                    <h3>Project Settings</h3>
                    <button className="close-sidebar-button" onClick={() => {
                      setIsProjectSidebarOpen(false);
                      setIsConfigSidebarOpen(false);
                    }}>
                      ✖ Close
                    </button>
                  </div>
                  <label>Project Name:</label>
                  <input type="text" className="sidebar-input-field" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                  <label>Description:</label>
                  <textarea className="sidebar-input-field" rows="6" value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} />
                </>
              )}

              {isConfigSidebarOpen && selected.node == null && selected.wall == null && selected.ap == null && (
                <>
                  <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                    <h3>Configuration Panel</h3>
                    <button className="close-sidebar-button" onClick={() => {
                      setIsProjectSidebarOpen(false);
                      setIsConfigSidebarOpen(false);
                    }}>
                      ✖ Close
                    </button>
                  </div>
                  <p>Select an item with the selector tool to view its configuration.</p>
                </>
              )}
              
              {isConfigSidebarOpen && selected.node && (
                <>
                  <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                    <h3>Node Configuration</h3>
                    <button className="close-sidebar-button" onClick={() => {
                      setIsProjectSidebarOpen(false);
                      setIsConfigSidebarOpen(false);
                    }}>
                      ✖ Close
                    </button>
                  </div>
                  <p>Node ID: {selected.node.id}</p>
                </>
              )}

              {isConfigSidebarOpen && selected.wall && (
                <>
                  <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                    <h3>Wall Configuration</h3>
                    <button className="close-sidebar-button" onClick={() => {
                      setIsProjectSidebarOpen(false);
                      setIsConfigSidebarOpen(false);
                    }}>
                      ✖ Close
                    </button>
                  </div>
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

                      const newLoss = MATERIALS[material].signalLoss ?? 1;
                      const newThickness = MATERIALS[material].thickness ?? 100;

                      setWalls(prevWalls => {
                        const updated = prevWalls.map(w =>
                          w.id === selected.wall.id
                            ? {
                                ...w,
                                config: {
                                  ...w.config,
                                  material,
                                  signalLoss: newLoss,
                                  thickness: newThickness,
                                }
                              }
                            : w
                        );
                        const updatedWall = updated.find(w => w.id === selected.wall.id);
                        setSelected(prev => ({ ...prev, wall: updatedWall }));
                        return updated;
                      });
                    }}
                  >
                    {Object.entries(MATERIALS).map(([key, value]) =>
                      key !== "unknown" ? (
                        <option key={key} value={key}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </option>
                      ) : null
                    )}
                  </select>


                  <label>Thickness (1–300mm):</label>
                  <input
                    type="number"
                    className="sidebar-input-field"
                    value={selected.wall.config?.thickness ?? 100}
                    min={1}
                    max={300}
                    step={1}
                    onChange={(e) => {
                      const value = Math.min(Number(e.target.value), 300);
                      updateWallConfig("thickness", value);
                    }}
                  />

                  <label>Signal Loss per mm (0.01–10 dB/mm):</label>
                  <input
                    type="number"
                    className="sidebar-input-field"
                    value={selected.wall.config?.signalLoss ?? 0.15}
                    min={0.01}
                    max={10}
                    step={0.01}
                    onChange={(e) => {
                      const value = Math.min(Number(e.target.value), 10);
                      updateWallConfig("signalLoss", value);
                    }}
                  />

                  <label>Total Signal Loss (dB):</label>
                  <input
                    type="number"
                    className="sidebar-input-field"
                    value={
                      selected.wall.config?.signalLoss && selected.wall.config?.thickness
                        ? (selected.wall.config.signalLoss * selected.wall.config.thickness).toFixed(2)
                        : ""
                    }
                    disabled
                  />

                  <p style={{ fontStyle: 'italic', marginTop: 0 }}>
                    (Estimated = Thickness × Signal Loss per mm)
                  </p>
                </>
              )}

              {isConfigSidebarOpen && selected.ap && (
                <>
                  <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                    <h3>Access Point Configuration</h3>
                    <button className="close-sidebar-button" onClick={() => {
                      setIsProjectSidebarOpen(false);
                      setIsConfigSidebarOpen(false);
                    }}>
                      ✖ Close
                    </button>
                  </div>
                  <p>GUID: {selected.ap.id}</p>

                  <label>Access Point Name:</label>
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

                  <label>Brand:</label>
                  <select
                    className="sidebar-input-field"
                    value={selected.ap.config?.brand || "Custom"}
                    onChange={(e) => updateAPConfig("brand", e.target.value)}
                    disabled
                  >
                    <option value="custom">Custom</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>

                  <label>Model:</label>
                  <select
                    className="sidebar-input-field"
                    value={selected.ap.config?.model || "Custom"}
                    onChange={(e) => updateAPConfig("model", e.target.value)}
                    disabled
                  >
                    <option value="custom">Custom</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>

                  <label>Frequency:</label>
                  <select
                    className="sidebar-input-field"
                    value={selected.ap.config?.frequency || "2.4GHz"}
                    onChange={(e) => updateAPConfig("frequency", e.target.value)}
                    disabled
                  >
                    <option value="2.4GHz">2.4GHz</option>
                    <option value="5GHz" disabled>5GHz</option>
                    <option value="Both" disabled>Both</option>
                  </select>

                  <label>Channel (1-13):</label>
                  <select
                    className="sidebar-input-field"
                    value={selected.ap.config?.channel || "1"}
                    onChange={(e) => updateAPConfig("channel", e.target.value)}
                  >
                    {Array.from({ length: 13 }, (_, i) => (
                      <option key={i + 1} value={String(i + 1)}>
                        {i + 1}
                      </option>
                    ))}
                  </select>


                  <label>Power (1-100dBm): </label>
                  <input
                    type="text"
                    className="sidebar-input-field"
                    value={selected.ap.config?.power}
                    onChange={(e) => {
                      const value = Math.min(Number(e.target.value), 100);
                      updateAPConfig("power", value);
                    }}
                  />

                  <label>Range (1-100m): </label>
                  <input
                    type="text"
                    className="sidebar-input-field"
                    value={selected.ap.config?.range}
                    onChange={(e) => {
                      const value = Math.min(Number(e.target.value), 100);
                      updateAPConfig("range", value);
                    }}
                  />

                  <label>Antenna Type:</label>
                  <select
                    className="sidebar-input-field"
                    value={selected.ap.config?.antennaType || "omnidirectional"}
                    onChange={(e) => updateAPConfig("antennaType", e.target.value)}
                    disabled
                  >
                    <option value="omnidirectional">Omnidirectional</option>
                    <option value="directional">Directional</option>
                  </select>
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
