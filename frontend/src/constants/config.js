export const BASE_GRID_SIZE = 10;

export const ALLOWED_ANGLES = [0, 45, 90, 135, 180];

export const MAX_HISTORY_LENGTH = 20;

export const SELECTED_COLOR = 'orange';

export const NODE_DISTANCE_THRESHOLD = 0.5;
export const WALL_MATCH_THRESHOLD = 0.75;
export const AP_DISTANCE_THRESHOLD = 0.6;

export const ZOOM = {
	MIN: 1,
	MAX: 50,
};

export const NODE_COLOR = '#888';
export const AP_COLOR = '#666';
export const TEXT_COLOR = '#777';

export const DEFAULT_WALL_CONFIG = {
	type: 'wall',
	material: 'drywall',
	thickness: 25, // mm
	signalLoss: 0.03, // dB
};

export const DEFAULT_AP_CONFIG = {
	brand: 'custom',
	model: 'custom',
	frequency: '2.4GHz',
	channel: '1',
	power: 5,
	range: 20,
	antennaType: 'omnidirectional',
};

export const DEFAULT_RF_CONFIG = {
	txPower: 10, // dBm — try 5 or 20 to test impact
	pl0: 30, // Path loss at 1m
	d0: 1, // Reference distance
	n: 2.2, // Path loss exponent (indoor)
	maxRangeMeters: 40, // Maximum effective range
};

export const MATERIALS = {
	drywall: {
		thickness: 25,
		signalLoss: 0.03,
		color: '#c6c9ca',
	},
	brick: {
		thickness: 100,
		signalLoss: 0.1,
		color: '#b65454',
	},
	concrete: {
		thickness: 150,
		signalLoss: 0.15,
		color: '#95A5A6',
	},
	wood: {
		thickness: 20,
		signalLoss: 0.02,
		color: '#665A4E',
	},
	glass: {
		thickness: 10,
		signalLoss: 0.1,
		color: '#a7c7cb',
	},
	metal: {
		thickness: 5,
		signalLoss: 0.2,
		color: '#aaaaaa',
	},
	unknown: {
		thickness: 0,
		signalLoss: 0,
		color: '#888',
	},
};
