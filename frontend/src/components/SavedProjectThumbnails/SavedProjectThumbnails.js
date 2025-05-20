import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './SavedProjectThumbnails.css';

/**
 * Small helper to format ISO strings into readable dates.
 */
const formatDate = (isoString) => {
	const options = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	};
	return new Date(isoString).toLocaleString(undefined, options);
};

/**
 * Displays saved project cards that can be opened or deleted.
 *
 * - Shows name, description, and timestamps
 * - Clicking opens a project, delete button triggers confirmation
 */
export const SavedProjectThumbnails = ({
	projects,
	handleOpenProject,
	confirmDeleteProject,
}) => {
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
						<p className="savedProjectTimestamp">
							Created: {formatDate(project.dateCreated)}
						</p>
						<p className="savedProjectTimestamp">
							Edited: {formatDate(project.lastEdited)}
						</p>
					</div>
				</div>
			))}
		</div>
	);
};
