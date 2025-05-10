export const BASE_GRID_SIZE = 10;

export const SIGNAL_STYLES = {
   excellent: "rgba(0,255,0,0.25)",
   good: "rgba(255,255,0,0.25)",
   fair: "rgba(255,165,0,0.25)",
   poor: "rgba(255,0,0,0.25)"
};

export const ALLOWED_ANGLES = [0, 45, 90, 135, 180];

export const MAX_HISTORY_LENGTH = 20;

export const SELECTED_COLOR = "orange";

export const NODE_DISTANCE_THRESHOLD = 0.5;
export const WALL_MATCH_THRESHOLD = 0.75;
export const AP_DISTANCE_THRESHOLD = 0.6;

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 50;

export const DEFAULT_AP_CONFIG = {
   brand: "Custom",
   model: "Custom",
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