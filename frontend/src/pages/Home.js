import { faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ButtonWithText } from "../components/ButtonWithText";
import { SavedProjectThumbnails } from "../components/SavedProjectThumbnails";
import "../styles/Home.css";

const { electronAPI } = window;

const Home = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [deleteProjectName, setDeleteProjectName] = useState(null);

  // Load projects from localStorage on page load
  useEffect(() => {
    const savedProjects = JSON.parse(localStorage.getItem("projects")) || [];
    setProjects(savedProjects);
  }, []);

  const handleCreateProject = () => {
    navigate("/newProject");
  };

  const handleOpenProject = (project) => {
    navigate("/workspace", { state: project });
  };

  // Open the delete confirmation modal
  const confirmDeleteProject = (projectName) => {
    setDeleteProjectName(projectName);
  };

  // Actually delete the project
  const handleDeleteProject = () => {
    if (!deleteProjectName) return;

    const updatedProjects = projects.filter((proj) => proj.name !== deleteProjectName);
    localStorage.setItem("projects", JSON.stringify(updatedProjects));
    setProjects(updatedProjects);
    setDeleteProjectName(null); // Close the modal
  };

  const handleQuit = () => {
    electronAPI.quitApp();
  };

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>WiFi Access Point Tool</h1>

      <div className="mainButtonsContainer">
        <ButtonWithText onClick={handleCreateProject} icon={faPlus} text="New Project" />
        <ButtonWithText onClick={handleQuit} icon={faXmark} text="Exit" />
      </div>

      

      <h2 style={{ marginTop: "30px" }}>Existing Projects</h2>
      {projects.length === 0 ? (
        <p>No projects found. Create a new one!</p>
      ) : (
        <SavedProjectThumbnails
          projects={projects}
          handleOpenProject={handleOpenProject}
          confirmDeleteProject={confirmDeleteProject}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteProjectName && (
        <>
          <div className="modal-overlay"></div>
          <div className="modal">
            <p>Are you sure you want to delete <strong>{deleteProjectName}</strong>?</p>
            <button className="delete-btn" onClick={handleDeleteProject}>
              Yes, Delete
            </button>
            <button className="cancel-btn" onClick={() => setDeleteProjectName(null)}>
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
