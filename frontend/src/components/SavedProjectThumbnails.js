import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from 'react';
import "../styles/SavedProjectThumbnails.css";
const formatDate = (isoString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(isoString).toLocaleString(undefined, options);
};

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
                     onClick={(event) => {
                        event.stopPropagation();
                        confirmDeleteProject(project)
                     }}
                     className="deleteButton"
                  >
                     <FontAwesomeIcon icon={faXmark} />
                  </button>
               </div>
               
               <p className="savedProjectDescription">{project.description}</p>

               <img></img>

               <div className="savedProjectTimestampContainer">
                  <p className="savedProjectTimestamp">Created: {formatDate(project.dateCreated)}</p>
                  <p className="savedProjectTimestamp">Edited: {formatDate(project.lastEdited)}</p>
               </div>
            </div>
         ))}
      </div>
   );
 };
 