import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const handleCreateProject = () => {
    navigate("/project");
  };

  const handleQuit = () => {
    window.electron?.quitApp();
  };

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>WiFi Access Point Tool</h1>
      <p>Create a new project or quit the application.</p>
      <button onClick={handleCreateProject} style={{ marginRight: "10px" }}>
        Create Project
      </button>
      <button onClick={handleQuit} style={{ background: "red", color: "white" }}>
        Quit
      </button>
    </div>
  );
};

export default Home;
