import { MATERIALS } from '../../constants/config';

const ConfigSidebar = ({ selected, updateElementConfig, onClose }) => {
	if (!selected.node && !selected.wall && !selected.ap) {
		return (
			<>
				<div className="sidebar-header">
					<h3>Configuration Panel</h3>
					<button className="close-sidebar-button" onClick={onClose}>
						✖ Close
					</button>
				</div>
				<p>Select an item with the selector tool to view its configuration.</p>
			</>
		);
	}

	if (selected.node) {
		return (
			<>
				<div className="sidebar-header">
					<h3>Node Configuration</h3>
					<button className="close-sidebar-button" onClick={onClose}>
						✖ Close
					</button>
				</div>
				<p>Node ID: {selected.node.id}</p>
			</>
		);
	}

	if (selected.wall) {
		const wall = selected.wall;

		return (
			<>
				<div className="sidebar-header">
					<h3>Wall Configuration</h3>
					<button className="close-sidebar-button" onClick={onClose}>
						✖ Close
					</button>
				</div>
				<p>Wall ID: {wall.id}</p>

				<label>Type:</label>
				<select
					className="sidebar-input-field"
					value={selected.wall.config?.type || 'wall'}
					onChange={(e) => updateElementConfig('wall', 'type', e.target.value)}
				>
					<option value="wall">Wall</option>
					<option value="doorway">Doorway</option>
					<option value="window">Window</option>
				</select>

				<label>Material:</label>
				<select
					className="sidebar-input-field"
					value={selected.wall.config?.material || 'drywall'}
					onChange={(e) => {
						const material = e.target.value;
						const newLoss = MATERIALS[material].signalLoss ?? 1;
						const newThickness = MATERIALS[material].thickness ?? 100;

						updateElementConfig('wall', 'material', material);
						updateElementConfig('wall', 'signalLoss', newLoss);
						updateElementConfig('wall', 'thickness', newThickness);
					}}
				>
					{Object.entries(MATERIALS).map(([key]) =>
						key !== 'unknown' ? (
							<option key={key} value={key}>
								{key.charAt(0).toUpperCase() + key.slice(1)}
							</option>
						) : null
					)}
				</select>

				<label>Thickness (1–300mm):</label>
				<input
					type="number"
					className="sidebar-input-field"
					value={selected.wall.config?.thickness ?? 100}
					min={1}
					max={300}
					step={1}
					onChange={(e) => {
						const value = Math.min(Number(e.target.value), 300);
						updateElementConfig('wall', 'thickness', value);
					}}
				/>

				<label>Signal Loss per mm (0.01–10 dB/mm):</label>
				<input
					type="number"
					className="sidebar-input-field"
					value={selected.wall.config?.signalLoss ?? 0.15}
					min={0.01}
					max={10}
					step={0.01}
					onChange={(e) => {
						const value = Math.min(Number(e.target.value), 10);
						updateElementConfig('wall', 'signalLoss', value);
					}}
				/>

				<label>Total Signal Loss (dB):</label>
				<input
					type="number"
					className="sidebar-input-field"
					value={
						selected.wall.config?.signalLoss && selected.wall.config?.thickness
							? (
									selected.wall.config.signalLoss *
									selected.wall.config.thickness
							  ).toFixed(2)
							: ''
					}
					disabled
				/>

				<p style={{ fontStyle: 'italic', marginTop: 0 }}>
					(Estimated = Thickness × Signal Loss per mm)
				</p>
			</>
		);
	}

	if (selected.ap) {
		return (
			<>
				<div
					style={{
						display: 'flex',
						flexDirection: 'row',
						justifyContent: 'space-between',
					}}
				>
					<h3>Access Point Configuration</h3>
					<button className="close-sidebar-button" onClick={onClose}>
						✖ Close
					</button>
				</div>
				<p>GUID: {selected.ap.id}</p>

				<label>Access Point Name:</label>
				<input
					type="text"
					className="sidebar-input-field"
					value={selected.ap.name}
					onChange={(e) =>
						updateElementConfig('ap', 'name', e.target.value, true)
					}
				/>

				<label>Brand:</label>
				<select
					className="sidebar-input-field"
					value={selected.ap.config?.brand || 'Custom'}
					onChange={(e) => updateElementConfig('ap', 'brand', e.target.value)}
					disabled
				>
					<option value="custom">Custom</option>
					<option value="1">1</option>
					<option value="2">2</option>
					<option value="3">3</option>
				</select>

				<label>Model:</label>
				<select
					className="sidebar-input-field"
					value={selected.ap.config?.model || 'Custom'}
					onChange={(e) => updateElementConfig('ap', 'model', e.target.value)}
					disabled
				>
					<option value="custom">Custom</option>
					<option value="1">1</option>
					<option value="2">2</option>
					<option value="3">3</option>
				</select>

				<label>Frequency:</label>
				<select
					className="sidebar-input-field"
					value={selected.ap.config?.frequency || '2.4GHz'}
					onChange={(e) =>
						updateElementConfig('ap', 'frequency', e.target.value)
					}
					disabled
				>
					<option value="2.4GHz">2.4GHz</option>
					<option value="5GHz" disabled>
						5GHz
					</option>
					<option value="Both" disabled>
						Both
					</option>
				</select>

				<label>Channel (1-13):</label>
				<select
					className="sidebar-input-field"
					value={selected.ap.config?.channel || '1'}
					onChange={(e) => updateElementConfig('ap', 'channel', e.target.value)}
				>
					{Array.from({ length: 13 }, (_, i) => (
						<option key={i + 1} value={String(i + 1)}>
							{i + 1}
						</option>
					))}
				</select>

				<label>Power (1-100dBm): </label>
				<input
					type="text"
					className="sidebar-input-field"
					value={selected.ap.config?.power}
					onChange={(e) => {
						const value = Math.min(Number(e.target.value), 100);
						updateElementConfig('ap', 'power', value);
					}}
				/>

				<label>Range (1-100m): </label>
				<input
					type="text"
					className="sidebar-input-field"
					value={selected.ap.config?.range}
					onChange={(e) => {
						const value = Math.min(Number(e.target.value), 100);
						updateElementConfig('ap', 'range', value);
					}}
				/>

				<label>Antenna Type:</label>
				<select
					className="sidebar-input-field"
					value={selected.ap.config?.antennaType || 'omnidirectional'}
					onChange={(e) =>
						updateElementConfig('ap', 'antennaType', e.target.value)
					}
					disabled
				>
					<option value="omnidirectional">Omnidirectional</option>
					<option value="directional">Directional</option>
				</select>
			</>
		);
	}
};

export default ConfigSidebar;
