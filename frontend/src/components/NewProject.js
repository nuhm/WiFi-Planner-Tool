import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Project = () => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreateProject = () => {
    if (!projectName.trim()) {
      alert("Please enter a project name.");
      return;
    }

    // Retrieve existing projects from localStorage
    const existingProjects = JSON.parse(localStorage.getItem("projects")) || [];

    // Check for duplicate project names
    if (existingProjects.some((proj) => proj.name === projectName)) {
      alert("A project with this name already exists. Please choose a different name.");
      return;
    }

    // Create new project object
    const newProject = { name: projectName, description };

    // Save to localStorage
    const updatedProjects = [...existingProjects, newProject];
    localStorage.setItem("projects", JSON.stringify(updatedProjects));

    console.log("Project created:", newProject);

    // Navigate to the workspace and pass project details
    navigate("/workspace", { state: newProject });
  };

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>Create a New Project</h1>

      <input
        type="text"
        placeholder="Enter project name"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        style={{ padding: "10px", width: "250px", marginBottom: "15px" }}
      />
      <br />

      <textarea
        placeholder="Enter project description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ padding: "10px", width: "250px", height: "100px", marginBottom: "15px" }}
      />
      <br />

      <button onClick={handleCreateProject} style={{ marginRight: "10px", padding: "10px" }}>
        Create Project
      </button>
      <button onClick={() => navigate("/")} style={{ background: "red", color: "white", padding: "10px" }}>
        Cancel
      </button>
    </div>
  );
};

export default Project;
