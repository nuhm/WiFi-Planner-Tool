const ProjectSidebar = ({
	projectName,
	setProjectName,
	projectDescription,
	setProjectDescription,
	onClose,
}) => {
	return (
		<>
			<div className="sidebar-header">
				<h3>Project Settings</h3>
				<button className="close-sidebar-button" onClick={onClose}>
					✖ Close
				</button>
			</div>

			<label>Project Name:</label>
			<input
				type="text"
				className="sidebar-input-field"
				value={projectName}
				onChange={(e) => setProjectName(e.target.value)}
			/>

			<label>Description:</label>
			<textarea
				className="sidebar-input-field"
				rows="6"
				value={projectDescription}
				onChange={(e) => setProjectDescription(e.target.value)}
			/>
		</>
	);
};

export default ProjectSidebar;
