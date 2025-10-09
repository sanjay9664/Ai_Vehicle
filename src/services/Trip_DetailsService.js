import { API_ENDPOINTS, OSM_ENDPOINTS, API_BASE_URL } from '../config/Trip_DetailsConfig';

const defaultHeaders = {
  'ngrok-skip-browser-warning': 'true',
  'Content-Type': 'application/json',
};

// Common fetch function with enhanced error handling and logging
const fetchWithErrorHandling = async (url, options = {}) => {
  console.log(`🔄 API Call: ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const responseText = await response.text();
    
    if (!responseText) {
      throw new Error('Empty response from server ');
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      throw new Error('Invalid JSON response from API');
    }

    console.log(`✅ API Success: ${url}`);
    return data;
  } catch (error) {
    console.error(`❌ API Failed: ${url}`, error);
    throw error;
  }
};

// Vehicles API calls
export const vehiclesAPI = {
  // Get all vehicles
  getAllVehicles: async () => {
    console.log("🚗 Fetching vehicles from:", API_ENDPOINTS.VEHICLES.BASE);
    return await fetchWithErrorHandling(API_ENDPOINTS.VEHICLES.BASE);
  },

  // Get latest vehicle data
  getLatestVehicleData: async (vehicleId, routeCoordinates = null) => {
    const { DEFAULT_COORDINATES } = API_ENDPOINTS;
    
    const fromLat = routeCoordinates?.from?.[0] || DEFAULT_COORDINATES.FROM_LAT;
    const fromLon = routeCoordinates?.from?.[1] || DEFAULT_COORDINATES.FROM_LON;
    const toLat = routeCoordinates?.to?.[0] || DEFAULT_COORDINATES.TO_LAT;
    const toLon = routeCoordinates?.to?.[1] || DEFAULT_COORDINATES.TO_LON;

    const url = API_ENDPOINTS.VEHICLES.LATEST(vehicleId, fromLat, fromLon, toLat, toLon);
    console.log(`📊 Fetching latest data for vehicle ${vehicleId}`);
    return await fetchWithErrorHandling(url);
  },

  // Get trip prediction
  getTripPrediction: async (vehicleId, predictionData) => {
    const { distance, temperature, traffic, battery } = predictionData;
    
    const url = API_ENDPOINTS.VEHICLES.PREDICTION(
      vehicleId, 
      distance || 50, 
      temperature || 25, 
      traffic || "Low", 
      battery || 100
    );
    
    console.log(`🔮 Getting prediction for vehicle ${vehicleId}`);
    return await fetchWithErrorHandling(url);
  }
};

// OSM API calls
export const osmAPI = {
  // Get location suggestions
  getLocationSuggestions: async (query) => {
    if (!query) return [];
    
    try {
      const url = OSM_ENDPOINTS.SEARCH(query);
      console.log(`🗺️ OSM Search: ${query}`);
      const response = await fetch(url, { mode: "cors" });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('OSM API Error:', error);
      return [];
    }
  },

  // Geocode address to coordinates
  geocodeAddress: async (address) => {
    if (!address) return null;
    
    try {
      const url = OSM_ENDPOINTS.SEARCH(address);
      const response = await fetch(url);
      const data = await response.json();
      return data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Geocoding Error:', error);
      return null;
    }
  }
};

// Server status check
export const checkServerStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: defaultHeaders
    });
    return response.ok;
  } catch (error) {
    console.error('Server status check failed:', error);
    return false;
  }
};

// Helper function to extract vehicle data from API response
export const extractVehicleData = (apiData) => {
  return {
    distance: apiData.distanceKm || apiData.distance || apiData.distanceKms || apiData.plannedDistanceKm || "",
    traffic: apiData.traffic || apiData.trafficLevel || "Low",
    temperature: apiData.tempBms || apiData.temperature || apiData.temp || apiData.ambientTemperature || apiData.ambientTemp || 25,
    battery: apiData.soc || apiData.battery || apiData.stateOfCharge || apiData.socBeforeTrip || apiData.currentSoc || ""
  };
};

// Helper function to format prediction data
export const formatPredictionData = (apiData, vehicleId) => {
  return {
    socPercentage: apiData.socBeforeTrip || 0,
    expectedSocAfterTrip: apiData.socAfterTrip || 0,
    estimatedTimeHours: apiData.estimatedTimeHours || apiData.estimatedTime || 0,
    distanceTravelled: apiData.plannedDistanceKm || 0,
    safeToGo: apiData.safeToGo || false,
    willReachDestination: apiData.willReachDestination || false,
    vehicleNum: apiData.vehicleNum || vehicleId,
    fullRangeKm: apiData.kmPossibleNow || 0,
    rangeRemainingKm: apiData.kmPossibleAfterTrip || 0,
    rechargeRequiredAtKm: apiData.rechargeRequiredAtKm || apiData.rechargeNeededAtKm || 0,
    cellImbalanceDetected: apiData.cellImbalenceDetected || false,
  };
};