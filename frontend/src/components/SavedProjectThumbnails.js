import "../styles/SavedProjectThumbnails.css";
import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export const SavedProjectThumbnails = ({ projects, handleOpenProject, confirmDeleteProject }) => {
   console.log(projects);

   if (!Array.isArray(projects) || projects.length === 0) {
     return <p>No projects found.</p>; // Show a message when no projects are available
   }
 
   return (
      <div className="savedProjectContainer">
         {projects.map((project) => (
            <div className="savedProject" onClick={() => handleOpenProject(project)}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                  <h2 className="savedProjectTitle">{project.name}</h2>
                  <button
                     onClick={() => confirmDeleteProject(project.name)}
                     className="deleteButton"
                  >
                     <FontAwesomeIcon icon={faXmark} />
                  </button>
               </div>
               
               <p className="savedProjectDescription">{project.description}</p>

               <img></img>
            </div>
         ))}
      </div>
   );
 };
 