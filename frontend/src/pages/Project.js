import React from "react";
import { useNavigate } from "react-router-dom";

const Project = () => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>Create a New Project</h1>
      <p>Project setup interface will go here.</p>
      <button onClick={() => navigate("/")}>Back to Home</button>
    </div>
  );
};

export default Project;
