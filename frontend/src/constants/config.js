export const BASE_GRID_SIZE = 10;

export const ALLOWED_ANGLES = [0, 45, 90, 135, 180];

export const MAX_HISTORY_LENGTH = 20;

export const SELECTED_COLOR = "orange";

export const NODE_DISTANCE_THRESHOLD = 0.5;
export const WALL_MATCH_THRESHOLD = 0.75;
export const AP_DISTANCE_THRESHOLD = 0.6;

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 50;

export const DEFAULT_WALL_CONFIG = {
   type: "wall",
   material: "drywall",
   thickness: 10, // cm
   signalLoss: 3, // dB
};

export const DEFAULT_AP_CONFIG = {
   brand: "custom",
   model: "custom",
   frequency: "2.4GHz",
   channel: "1",
   power: 5,
   range: 20,
   antennaType: "omnidirectional"
};

export const DEFAULT_RF_CONFIG = {
   txPower: 10,         // dBm — try 5 or 20 to test impact
   pl0: 30,             // Path loss at 1m
   d0: 1,               // Reference distance
   n: 2.2,              // Path loss exponent (indoor)
   maxRangeMeters: 40   // Maximum effective range
};

export const MATERIAL_SIGNAL_LOSS = {
  drywall: 3,
  concrete: 12,
  glass: 5,
};