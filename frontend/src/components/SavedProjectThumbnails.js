import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "../styles/SavedProjectThumbnails.css";

/**
 * Formats an ISO date string into a readable format.
 * @param {string} isoString - The date string to format.
 * @returns {string} A human-readable date/time string.
 */
const formatDate = (isoString) => {
   const options = {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
   };
   return new Date(isoString).toLocaleString(undefined, options);
};

export const SavedProjectThumbnails = ({ projects, handleOpenProject, confirmDeleteProject }) => {
   if (!Array.isArray(projects) || projects.length === 0) {
      return <p className="noProjectsText">No saved projects found.</p>;
   }

   return (
      <div className="savedProjectContainer">
         {projects.map((project) => (
         <div
            key={project.id || project.name} // Fallback to name if no ID
            className="savedProject"
            onClick={() => handleOpenProject(project)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
               if (e.key === 'Enter') handleOpenProject(project);
            }}
         >
            <div className="savedProjectHeader">
               <h2 className="savedProjectTitle">{project.name}</h2>
               <button
                  onClick={(event) => {
                     event.stopPropagation(); // Prevent card click
                     confirmDeleteProject(project);
                  }}
                  className="deleteButton"
                  aria-label={`Delete project ${project.name}`}
               >
                  <FontAwesomeIcon icon={faXmark} />
               </button>
            </div>

            <p className="savedProjectDescription">{project.description}</p>

            <div className="savedProjectTimestampContainer">
               <p className="savedProjectTimestamp">Created: {formatDate(project.dateCreated)}</p>
               <p className="savedProjectTimestamp">Edited: {formatDate(project.lastEdited)}</p>
            </div>
         </div>
         ))}
      </div>
   );
};
