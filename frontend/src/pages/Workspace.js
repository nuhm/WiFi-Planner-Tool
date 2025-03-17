import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Workspace = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { name, description } = location.state || {};

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>Workspace: {name}</h1>
      <p>{description}</p>

      <button onClick={() => navigate("/")}>Back to Home</button>
    </div>
  );
};

export default Workspace;
