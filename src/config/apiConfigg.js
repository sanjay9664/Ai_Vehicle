// src/config/apiConfig.js

const getApiBaseUrl = () => {
  // Check if we're in development mode and want to use local server
  if (process.env.NODE_ENV === 'development' && 
      process.env.REACT_APP_USE_LOCAL_SERVER === 'true') {
    return process.env.REACT_APP_LOCAL_API_BASE_URL || 'http://192.168.68.133:8088';
  }
  
  // Default to ngrok server
  return process.env.REACT_APP_NGROK_API_BASE_URL || 'https://nonteleological-brimfully-reid.ngrok-free.dev';
};

const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  // Vehicles endpoints
  VEHICLES: {
    BASE: `${API_BASE_URL}/api/iotdata/vehicles`,
    LATEST: (vehicleId, fromLat, fromLon, toLat, toLon) => 
      `${API_BASE_URL}/api/iotdata/vehicles/latest/${vehicleId}?fromLat=${fromLat}&fromLon=${fromLon}&toLat=${toLat}&toLon=${toLon}`,
    PREDICTION: (vehicleId, distance, temperature, traffic, battery) =>
      `${API_BASE_URL}/api/iotdata/vehicles/prediction/${vehicleId}?distanceKms=${distance}&temperature=${temperature}&traffic=${traffic}&soc=${battery}`
  },
  
  // Theft Detection endpoints
  THEFT_DETECTION: {
    BASE: `${API_BASE_URL}/api/theftdetection`,
    BY_ID: (id) => `${API_BASE_URL}/api/theftdetection/${id}`
  },
  
  // Vehicle History endpoints
  VEHICLE_HISTORY: {
    BASE: `${API_BASE_URL}/api/vehicleHistory`,
    BY_ID: (id) => `${API_BASE_URL}/api/vehicleHistory/${id}`
  },
  
  // Rider Score endpoints
  RIDER_SCORE: {
    BASE: `${API_BASE_URL}/api/riderScore`,
    BY_ID: (id) => `${API_BASE_URL}/api/riderScore/${id}`
  },
  
  // Default coordinates (Bangalore to Mumbai)
  DEFAULT_COORDINATES: {
    FROM_LAT: 12.9716,
    FROM_LON: 77.5946,
    TO_LAT: 19.0760,
    TO_LON: 72.8777
  }
};

export const OSM_ENDPOINTS = {
  NOMINATIM: process.env.REACT_APP_OSM_NOMINATIM_URL || "https://nominatim.openstreetmap.org",
  SEARCH: (query) => 
    `${process.env.REACT_APP_OSM_NOMINATIM_URL || "https://nominatim.openstreetmap.org"}/search?format=json&q=${encodeURIComponent(query)}`
};