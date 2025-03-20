import React from 'react';

export const SavedProjectThumbnails = ({ projects, handleOpenProject, confirmDeleteProject }) => {
   console.log(projects);

   if (!Array.isArray(projects) || projects.length === 0) {
     return <p>No projects found.</p>; // Show a message when no projects are available
   }
 
   return (
     <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
       {projects.map((project) => (
         <li key={project.name} style={{ marginBottom: "10px" }}>
           <strong>{project.name}</strong> - {project.description}
           <br />
           <button onClick={() => handleOpenProject(project)} style={{ marginRight: "5px" }}>
             Open
           </button>
           <button
             onClick={() => confirmDeleteProject(project.name)}
             style={{ background: "red", color: "white" }}
           >
             Delete
           </button>
         </li>
       ))}
     </ul>
   );
 };
 