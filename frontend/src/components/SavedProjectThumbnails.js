import "../styles/SavedProjectThumbnails.css";
import React from 'react';

export const SavedProjectThumbnails = ({ projects, handleOpenProject, confirmDeleteProject }) => {
   console.log(projects);

   if (!Array.isArray(projects) || projects.length === 0) {
     return <p>No projects found.</p>; // Show a message when no projects are available
   }
 
   return (
      <div className="savedProjectContainer">
         {projects.map((project) => (
            <div className="savedProject" onClick={() => handleOpenProject(project)}>
               <h2 className="savedProjectTitle">{project.name}</h2>
               <p className="savedProjectDescription">{project.description}</p>
               <button
                  onClick={() => confirmDeleteProject(project.name)}
                  style={{ background: "red", color: "white" }}
               >
                  Delete
               </button>
            </div>
         ))}
      </div>
   );
 };
 