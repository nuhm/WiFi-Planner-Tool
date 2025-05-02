import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/NewProject.css";

const Project = () => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const nameInputRef = useRef();

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleCreateProject = () => {
    const trimmedName = projectName.trim();
    if (!trimmedName) {
      setError("Please enter a project name.");
      return;
    }

    const existingProjects = JSON.parse(localStorage.getItem("projects")) || [];

    const isDuplicate = existingProjects.some(proj => proj.name.trim().toLowerCase() === trimmedName.toLowerCase());
    if (isDuplicate) {
      setError("A project with this name already exists.");
      return;
    }

    const generatedId = crypto.randomUUID();

    const now = new Date().toISOString();
    const newProject = {
      id: generatedId,
      name: trimmedName,
      description: description,
      dateCreated: now,
      lastEdited: now
    };
    const updatedProjects = [...existingProjects, newProject];
    localStorage.setItem("projects", JSON.stringify(updatedProjects));

    navigate("/workspace", { state: newProject });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && projectName.trim()) {
      handleCreateProject();
    }
  };

  return (
    <div className="newProjectContainer">
      <h1>Create a New Project</h1>

      <div className="newProjectForm">
        <input
          ref={nameInputRef}
          type="text"
          placeholder="Enter project name"
          value={projectName}
          onChange={(e) => {
            setProjectName(e.target.value);
            setError("");
          }}
          onKeyDown={handleKeyDown}
        />

        <textarea
          rows="6"
          placeholder="Enter project description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {error && (
          <p style={{ color: "#ff5f5f", marginBottom: "15px", fontSize: "0.9rem" }}>
            {error}
          </p>
        )}

        <div className="newProjectFormButtons">
          <button
            className="createProjectButton"
            onClick={handleCreateProject}
            disabled={!projectName.trim()}
          >
            Create Project
          </button>

          <button
            className="redButton"
            onClick={() => navigate("/")}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Project;
