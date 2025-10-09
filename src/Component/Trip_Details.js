// src/Component/EVRiderAssist.js

import React, { useState, useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-routing-machine";
import { Modal, Button, Form, Card, Spinner, Row, Col } from "react-bootstrap";

// Import API services
import { vehiclesAPI, osmAPI, extractVehicleData, formatPredictionData } from '../services/Trip_DetailsService';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Custom icons
const fromIcon = new L.Icon({
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const toIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const formatTripTime = (hours) => {
  if (!hours && hours !== 0) return "-";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return `${hours.toFixed(2)} hrs`;
};

// Inline Styles
const inputStyle = {
  backgroundColor: "white",
  color: "black",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  width: "100%",
  fontSize: "14px"
};

const suggestionStyle = {
  background: "#fff",
  color: "#000",
  position: "absolute",
  zIndex: 1000,
  width: "100%",
  maxHeight: "150px",
  overflowY: "auto",
  border: "1px solid #ccc",
  padding: 0,
  margin: 0,
  listStyle: "none",
  borderRadius: "5px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
};

const suggestionItemStyle = {
  padding: "10px",
  cursor: "pointer",
  borderBottom: "1px solid #eee",
  fontSize: "14px",
  transition: "background-color 0.2s"
};

const suggestionItemHoverStyle = {
  backgroundColor: "#f8f9fa"
};

const metricTileStyle = {
  background: "rgba(255, 255, 255, 0.1)",
  borderRadius: "10px",
  padding: "12px",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
  height: "100%",
  display: "flex",
  alignItems: "center",
  transition: "transform 0.2s"
};

const metricIconStyle = {
  fontSize: "1.8rem",
  marginRight: "12px"
};

const metricLabelStyle = {
  fontSize: "0.75rem",
  color: "#ffffff",
  opacity: "0.9",
  marginBottom: "3px",
  fontWeight: "500"
};

const metricValueStyle = {
  fontSize: "1.1rem",
  fontWeight: "bold",
  color: "#ffffff"
};

const batteryTileStyle = {
  background: "rgba(255, 255, 255, 0.1)",
  borderRadius: "12px",
  padding: "15px",
  border: "2px solid rgba(255, 255, 255, 0.3)",
  display: "flex",
  alignItems: "center",
  height: "100%",
  boxShadow: "0 3px 8px rgba(0, 0, 0, 0.3)"
};

const batteryIconStyle = {
  fontSize: "2.5rem",
  marginRight: "15px"
};

const batteryLabelStyle = {
  fontSize: "0.85rem",
  color: "#ffffff",
  opacity: "0.9",
  marginBottom: "5px",
  fontWeight: "500"
};

const batteryValueStyle = {
  fontSize: "1.8rem",
  fontWeight: "bold"
};

const decisionTileStyle = {
  background: "rgba(255, 255, 255, 0.1)",
  borderRadius: "10px",
  padding: "15px",
  border: "2px solid",
  display: "flex",
  alignItems: "center",
  height: "100%",
  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)"
};

const decisionIconStyle = {
  fontSize: "2rem",
  marginRight: "12px"
};

const decisionLabelStyle = {
  fontSize: "0.8rem",
  color: "#ffffff",
  opacity: "0.9",
  marginBottom: "3px",
  fontWeight: "500"
};

const decisionValueStyle = {
  fontSize: "1.2rem",
  fontWeight: "bold"
};

export default function EVRiderAssist() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({
    distance: "",
    traffic: "Low",
    temperature: "",
    battery: "",
  });
  const [prediction, setPrediction] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState({
    from: null,
    to: null,
  });
  const [apiCalls, setApiCalls] = useState({
    firstApi: "",
    secondApi: ""
  });
  const [editMode, setEditMode] = useState(false);
  const [hoveredSuggestion, setHoveredSuggestion] = useState(null);

  const mapRef = useRef(null);
  const routingControlRef = useRef(null);

  // Fetch vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setVehicleLoading(true);
        const data = await vehiclesAPI.getAllVehicles();
        
        if (Array.isArray(data)) {
          setVehicles(data);
        } else if (data.vehicles && Array.isArray(data.vehicles)) {
          setVehicles(data.vehicles);
        } else if (data.data && Array.isArray(data.data)) {
          setVehicles(data.data);
        } else {
          console.warn("Unexpected vehicles response format:", data);
          setVehicles([]);
        }
      } catch (error) {
        console.error("Failed to fetch vehicles:", error);
        setVehicles([]);
      } finally {
        setVehicleLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  // Fetch location suggestions with debouncing
  const fetchSuggestions = async (query, setFunc) => {
    if (query.length < 3) {
      setFunc([]);
      return;
    }
    
    try {
      const suggestions = await osmAPI.getLocationSuggestions(query);
      // Filter out duplicate or very similar results
      const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
        index === self.findIndex((s) => s.display_name === suggestion.display_name)
      );
      setFunc(uniqueSuggestions.slice(0, 5)); // Limit to 5 results
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setFunc([]);
    }
  };

  // Handle selecting place - UPDATED FOR EDIT MODE
  const handleSelect = async (place, type) => {
    const selectedPlaceName = place.display_name;
    
    if (type === "from") {
      setFrom(selectedPlaceName);
      setFromSuggestions([]);
      setRouteCoordinates((prev) => ({ 
        ...prev, 
        from: [parseFloat(place.lat), parseFloat(place.lon)] 
      }));
    } else {
      setTo(selectedPlaceName);
      setToSuggestions([]);
      setRouteCoordinates((prev) => ({ 
        ...prev, 
        to: [parseFloat(place.lat), parseFloat(place.lon)] 
      }));
    }

    // Calculate route when both locations are available - ALWAYS calculate in edit mode
    if (type === "from" && to) {
      await calculateRouteDistance(selectedPlaceName, to);
    } else if (type === "to" && from) {
      await calculateRouteDistance(from, selectedPlaceName);
    } else if (editMode) {
      // In edit mode, if we have both locations, calculate route
      if (from && to) {
        await calculateRouteDistance(from, to);
      }
    }
  };

  // Calculate route
  const calculateRouteDistance = async (fromPlace, toPlace) => {
    try {
      const fromData = await osmAPI.geocodeAddress(fromPlace);
      const toData = await osmAPI.geocodeAddress(toPlace);
      if (!fromData || !toData) return;

      const fromCoords = [parseFloat(fromData.lat), parseFloat(fromData.lon)];
      const toCoords = [parseFloat(toData.lat), parseFloat(toData.lon)];

      setRouteCoordinates({ from: fromCoords, to: toCoords });

      if (routingControlRef.current && mapRef.current) {
        mapRef.current.removeControl(routingControlRef.current);
      }

      routingControlRef.current = L.Routing.control({
        waypoints: [L.latLng(fromCoords), L.latLng(toCoords)],
        lineOptions: { styles: [{ color: "blue", weight: 6, opacity: 0.7 }] },
        show: false,
        addWaypoints: false,
        routeWhileDragging: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        createMarker: () => null,
      });

      routingControlRef.current.on("routesfound", function (e) {
        const routes = e.routes;
        if (routes && routes.length > 0) {
          const route = routes[0];
          const km = (route.summary.totalDistance / 1000).toFixed(1);
          setFormData((prev) => ({ ...prev, distance: km }));
          if (mapRef.current) mapRef.current.fitBounds(route.coordinates);
        }
      });

      routingControlRef.current.addTo(mapRef.current);
    } catch (err) {
      console.error("Route calculation error:", err);
    }
  };

  // Check if all inputs are filled for automatic prediction
  const areAllInputsFilled = () => {
    return formData.distance && 
           formData.temperature && 
           formData.battery && 
           from && 
           to &&
           formData.distance > 0 &&
           formData.temperature !== "" &&
           formData.battery > 0;
  };

  // Vehicle selection - UPDATED FOR EDIT MODE
  const handleVehicleSelect = async (e) => {
    const vehicleId = e.target.value;

    if (vehicleId === "default") {
      setSelectedVehicle(null);
      setPrediction(null);
      return;
    }

    setSelectedVehicle(vehicleId);

    // If in edit mode, don't auto-fetch prediction, let user manually trigger
    if (editMode) {
      setShowModal(true); // Show modal for manual prediction
      return;
    }

    try {
      setLoading(true);

      const vehicleData = await vehiclesAPI.getLatestVehicleData(vehicleId, routeCoordinates);
      
      const extractedData = extractVehicleData(vehicleData);
      const updatedFormData = {
        distance: formData.distance || extractedData.distance,
        traffic: formData.traffic || extractedData.traffic,
        temperature: formData.temperature || extractedData.temperature,
        battery: formData.battery || extractedData.battery,
      };

      setFormData(updatedFormData);

      if (areAllInputsFilled()) {
        await handleTripPredictionAutomatically(vehicleId, updatedFormData);
      } else {
        setShowModal(true);
      }

    } catch (error) {
      console.error("Failed in vehicle selection process:", error);
      
      const defaultFormData = {
        distance: formData.distance || "",
        traffic: formData.traffic || "Low",
        temperature: formData.temperature || 25,
        battery: formData.battery || "",
      };
      
      setFormData(defaultFormData);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Automatic prediction when all inputs are filled
  const handleTripPredictionAutomatically = async (vehicleId, formDataToUse) => {
    if (!vehicleId || !from || !to) return;

    try {
      setLoading(true);

      const predictionData = await vehiclesAPI.getTripPrediction(vehicleId, formDataToUse);
      const formattedPrediction = formatPredictionData(predictionData, vehicleId);
      
      setPrediction(formattedPrediction);
      setShowModal(false);
      setEditMode(false);

    } catch (err) {
      console.error("Prediction error:", err);
      
      // Fallback to mock data
      const battery = parseFloat(formDataToUse.battery) || 100;
      const distance = parseFloat(formDataToUse.distance) || 50;
      const consumptionRate = 0.7;
      
      const expectedSocAfterTrip = Math.max(0, battery - (distance * consumptionRate));
      const estimatedTime = distance / 40;
      const kmPossibleNow = battery / consumptionRate;
      
      const mockPrediction = {
        socPercentage: battery,
        expectedSocAfterTrip: Math.round(expectedSocAfterTrip),
        estimatedTimeHours: estimatedTime,
        distanceTravelled: distance,
        fullRangeKm: kmPossibleNow.toFixed(2),
        rangeRemainingKm: Math.max(0, (expectedSocAfterTrip / consumptionRate)).toFixed(2),
        rechargeRequiredAtKm: kmPossibleNow.toFixed(2),
        safeToGo: expectedSocAfterTrip > 15,
        willReachDestination: expectedSocAfterTrip > 5,
        vehicleNum: vehicleId,
        cellImbalanceDetected: battery < 20 || expectedSocAfterTrip < 10,
      };
      
      setPrediction(mockPrediction);
      setShowModal(false);
      setEditMode(false);
    } finally {
      setLoading(false);
    }
  };

  // Manual prediction trigger
  const handleTripPrediction = async (e) => {
    if (e) e.preventDefault();
    if (!selectedVehicle) return alert("Please select a vehicle first!");
    if (!from || !to) return alert("Please enter both From and To locations.");

    await handleTripPredictionAutomatically(selectedVehicle, formData);
  };

  // Handle form input changes and auto-trigger prediction when all fields are filled
  const handleChange = (e) => {
    const newFormData = { ...formData, [e.target.name]: e.target.value };
    setFormData(newFormData);

    if (selectedVehicle && areAllInputsFilled() && !editMode) {
      setTimeout(() => {
        handleTripPredictionAutomatically(selectedVehicle, newFormData);
      }, 500);
    }
  };

  // Edit button handler - UPDATED
  const handleEdit = () => {
    setEditMode(true);
    console.log("Edit mode activated - inputs enabled");
  };

  // Reset prediction when locations change in edit mode
  useEffect(() => {
    if (editMode && (from || to)) {
      // Clear prediction when user starts editing locations
      setPrediction(null);
    }
  }, [from, to, editMode]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fromSuggestions.length > 0 && !event.target.closest('.from-suggestions-container')) {
        setFromSuggestions([]);
      }
      if (toSuggestions.length > 0 && !event.target.closest('.to-suggestions-container')) {
        setToSuggestions([]);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [fromSuggestions, toSuggestions]);

  const getVehicleName = (v) => {
    if (!v) return "Unknown Vehicle";
    if (typeof v === 'object') return v.name || v.vehicleName || v.vehicle_name || `Vehicle ${v.id || v.vehicleId || v}`;
    return `Vehicle ${v}`;
  };

  // Tile component for individual metrics
  const MetricTile = ({ icon, label, value, unit = "", className = "" }) => (
    <div className={`metric-tile ${className}`} style={metricTileStyle}>
      <div className="metric-icon" style={metricIconStyle}>{icon}</div>
      <div className="metric-content">
        <div className="metric-label" style={metricLabelStyle}>{label}</div>
        <div className="metric-value" style={metricValueStyle}>
          {value} {unit}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container-fluid bg-dark text-white" style={{ height: "100vh", overflow: "hidden" }}>
      {/* Header Section */}
      <div className="p-3 border-bottom border-secondary">
        <h2 className="text-center mb-2">🚴‍♂️ EV Rider Assist</h2>
      </div>

      {/* Main Content - Split Layout */}
      <div className="row g-0" style={{ height: "calc(100vh - 120px)" }}>
        {/* Left Panel - Details (Scrollable) */}
        <div className="col-md-6 p-3" style={{ height: "100%", overflowY: "auto" }}>
          {/* From & To Inputs */}
          <div className="from-suggestions-container" style={{ position: "relative", marginBottom: "15px" }}>
            <input
              type="text"
              placeholder="From"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                fetchSuggestions(e.target.value, setFromSuggestions);
              }}
              style={inputStyle}
              disabled={prediction && !editMode} // FIXED: Only disable when prediction exists AND not in edit mode
            />
            {fromSuggestions.length > 0 && (
              <ul style={suggestionStyle}>
                {fromSuggestions.map((s, index) => (
                  <li
                    key={s.place_id}
                    onClick={() => handleSelect(s, "from")}
                    style={{
                      ...suggestionItemStyle,
                      ...(hoveredSuggestion === `from-${index}` ? suggestionItemHoverStyle : {})
                    }}
                    onMouseEnter={() => setHoveredSuggestion(`from-${index}`)}
                    onMouseLeave={() => setHoveredSuggestion(null)}
                  >
                    {s.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
 
          <div className="to-suggestions-container" style={{ position: "relative", marginBottom: "15px" }}>
            <input
              type="text"
              placeholder="To"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                fetchSuggestions(e.target.value, setToSuggestions);
              }}
              style={{ ...inputStyle }}
              disabled={prediction && !editMode} // FIXED: Only disable when prediction exists AND not in edit mode
            />
            {toSuggestions.length > 0 && (
              <ul style={suggestionStyle}>
                {toSuggestions.map((s, index) => (
                  <li
                    key={s.place_id}
                    onClick={() => handleSelect(s, "to")}
                    style={{
                      ...suggestionItemStyle,
                      ...(hoveredSuggestion === `to-${index}` ? suggestionItemHoverStyle : {})
                    }}
                    onMouseEnter={() => setHoveredSuggestion(`to-${index}`)}
                    onMouseLeave={() => setHoveredSuggestion(null)}
                  >
                    {s.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Vehicle Dropdown and Edit Button */}
          <div className="d-flex gap-2 mb-3">
            <Form.Select
              onChange={handleVehicleSelect}
              style={{ backgroundColor: "white", color: "black", flex: 1 }}
              disabled={vehicleLoading || (prediction && !editMode)} // FIXED: Enable in edit mode
            >
              <option value="default">Choose EV Vehicle</option>
              {vehicles.map((vehicle, index) => {
                const vehicleId = typeof vehicle === 'object' ? vehicle.id || vehicle.vehicleId || index : vehicle;
                const vehicleName = getVehicleName(vehicle);
                return (
                  <option key={index} value={vehicleId}>
                    {vehicleName}
                  </option>
                );
              })}
            </Form.Select>

            {prediction && (
              <Button 
                variant="outline-warning" 
                onClick={handleEdit}
                style={{ minWidth: "80px" }}
              >
                ✏️ Edit
              </Button>
            )}
          </div>

          {/* Edit Mode Status */}
          {editMode && (
            <div className="alert alert-warning mb-3" style={{ fontSize: "0.9rem" }}>
              <small>✏️ <strong>Edit Mode Active</strong> - You can now change locations and vehicle. Update locations and click "Get Prediction" to see new results.</small>
            </div>
          )}

          {vehicleLoading && (
            <div className="text-center mb-3">
              <Spinner animation="border" variant="info" size="sm" />
              <span className="ms-2">Loading vehicles...</span>
            </div>
          )}

          {/* Auto-prediction status */}
          {selectedVehicle && areAllInputsFilled() && !prediction && !editMode && (
            <div className="alert alert-info mb-3" style={{ fontSize: "0.9rem" }}>
              <small>✅ All inputs filled. Prediction will be calculated automatically...</small>
            </div>
          )}

          {/* Prediction Card */}
          {prediction && (
            <Card
              className="mb-3"
              style={{
                background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
                border: prediction.safeToGo ? "2px solid #28a745" : "2px solid #dc3545",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
              }}
            >
              <Card.Body className="text-white">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Card.Title
                    className={prediction.safeToGo ? "text-success fw-bold" : "text-danger fw-bold"}
                    style={{ margin: 0, fontSize: "1.2rem" }}
                  >
                    🚘 Vehicle {prediction.vehicleNum || selectedVehicle}
                  </Card.Title>
                  <div>
                    {prediction.cellImbalanceDetected && (
                      <span className="badge bg-warning text-dark me-2" style={{ fontSize: "0.7rem" }}>
                        ⚠️ Cell Imbalance Detected
                      </span>
                    )}
                    {!prediction.safeToGo && (
                      <span className="badge bg-danger" style={{ fontSize: "0.7rem" }}>
                        🔴 Not Safe to Go
                      </span>
                    )}
                  </div>
                </div>

                {/* Battery Status Row */}
                <Row className="mb-3">
                  <Col md={6} className="mb-2">
                    <div className="battery-tile" style={batteryTileStyle}>
                      <div className="battery-icon" style={batteryIconStyle}>🔋</div>
                      <div className="battery-content">
                        <div className="battery-label" style={batteryLabelStyle}>Current Battery</div>
                        <div className="battery-value text-info" style={batteryValueStyle}>
                          {prediction.socPercentage ?? 0}%
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col md={6} className="mb-2">
                    <div className="battery-tile" style={batteryTileStyle}>
                      <div className="battery-icon" style={batteryIconStyle}>🔋</div>
                      <div className="battery-content">
                        <div className="battery-label" style={batteryLabelStyle}>After Trip</div>
                        <div className={`battery-value ${prediction.expectedSocAfterTrip > 20 ? "text-success" : prediction.expectedSocAfterTrip > 10 ? "text-warning" : "text-danger"}`} style={batteryValueStyle}>
                          {prediction.expectedSocAfterTrip ?? 0}%
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Status Tiles */}
                <Row className="mb-3">
                  <Col md={6} lg={4} className="mb-2">
                    <MetricTile
                      icon="⏱"
                      label="Trip Time"
                      value={formatTripTime(prediction.estimatedTimeHours ?? 0)}
                    />
                  </Col>
                  <Col md={6} lg={4} className="mb-2">
                    <MetricTile
                      icon="📏"
                      label="Distance"
                      value={prediction.distanceTravelled ?? 0}
                      unit="km"
                    />
                  </Col>
                  <Col md={6} lg={4} className="mb-2">
                    <MetricTile
                      icon="🛣"
                      label="Full Range"
                      value={(prediction.fullRangeKm ?? 0).toFixed(2)}
                      unit="km"
                    />
                  </Col>
                  <Col md={6} lg={4} className="mb-2">
                    <MetricTile
                      icon="🔋"
                      label="Range After Trip"
                      value={(prediction.rangeRemainingKm ?? 0).toFixed(2)}
                      unit="km"
                    />
                  </Col>
                  <Col md={6} lg={4} className="mb-2">
                    <div className="decision-tile" style={{
                      ...decisionTileStyle,
                      borderColor: prediction.safeToGo ? "#28a745" : "#dc3545"
                    }}>
                      <div className="decision-icon" style={decisionIconStyle}>
                        {prediction.safeToGo ? "✅" : "❌"}
                      </div>
                      <div className="decision-content">
                        <div className="decision-label" style={decisionLabelStyle}>Safe to Go</div>
                        <div className="decision-value" style={{
                          ...decisionValueStyle,
                          color: prediction.safeToGo ? "#28a745" : "#dc3545"
                        }}>
                          {prediction.safeToGo ? "Yes" : "No"}
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col md={6} lg={4} className="mb-2">
                    <div className="decision-tile" style={{
                      ...decisionTileStyle,
                      borderColor: (!prediction.safeToGo && prediction.rechargeRequiredAtKm > 0) ? "#dc3545" : "#28a745"
                    }}>
                      <div className="decision-icon" style={decisionIconStyle}>
                        {(!prediction.safeToGo && prediction.rechargeRequiredAtKm > 0) ? "⚠️" : "🎯"}
                      </div>
                      <div className="decision-content">
                        <div className="decision-label" style={decisionLabelStyle}>Reach Destination</div>
                        <div className="decision-value" style={{
                          ...decisionValueStyle,
                          color: (!prediction.safeToGo && prediction.rechargeRequiredAtKm > 0) ? "#dc3545" : "#28a745"
                        }}>
                          {(!prediction.safeToGo && prediction.rechargeRequiredAtKm > 0) ? "No" : "Yes"}
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Recharge Info - Show when safeToGo is false */}
                {!prediction.safeToGo && prediction.rechargeRequiredAtKm > 0 && (
                  <div className="recharge-info mt-2 p-2 text-center" style={{
                    background: "rgba(255,193,7,0.1)",
                    borderRadius: "5px",
                    border: "1px solid #ffc107",
                    fontSize: "0.8rem"
                  }}>
                    <small className="text-warning">
                      ⛽ Recharge needed after: <strong>
                        {parseFloat(prediction.rechargeRequiredAtKm).toFixed(0)} km
                      </strong>
                    </small>
                  </div>
                )}

                {/* Cell Imbalance Warning */}
                {prediction.cellImbalanceDetected && (
                  <div className="cell-imbalance-warning mt-2 p-2 text-center" style={{
                    background: "rgba(255,193,7,0.1)",
                    borderRadius: "5px",
                    border: "1px solid #ffc107",
                    fontSize: "0.8rem"
                  }}>
                    <small className="text-warning">⚠️ Cell imbalance detected. Please check battery health.</small>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </div>

        {/* Right Panel - Map */}
        <div className="col-md-6" style={{ height: "100%" }}>
          <MapContainer
            center={[28.6139, 77.209]}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
            whenCreated={(map) => (mapRef.current = map)}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {routeCoordinates.from && <Marker position={routeCoordinates.from} icon={fromIcon}><Popup>From: {from}</Popup></Marker>}
            {routeCoordinates.to && <Marker position={routeCoordinates.to} icon={toIcon}><Popup>To: {to}</Popup></Marker>}
          </MapContainer>
        </div>
      </div>

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="bg-dark text-white border-0">
          <Modal.Title className="fw-bold text-info">
            {editMode ? "✏️ Update Trip Prediction" : "🚀 Trip Details"} – {getVehicleName(selectedVehicle)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" variant="info" />
              <p className="mt-2">Calculating prediction...</p>
            </div>
          ) : (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="text-white">📍 Distance (km)</Form.Label>
                <Form.Control
                  type="number"
                  name="distance"
                  value={formData.distance}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                />  
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="text-white">🚦 Traffic Level</Form.Label>
                <Form.Select
                  name="traffic"
                  value={formData.traffic}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="text-white">🌡️ Temperature (°C)</Form.Label>
                <Form.Control
                  type="number"
                  name="temperature"
                  value={formData.temperature || ""}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                  placeholder="Enter temperature"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="text-white">🔋 Starting Battery (%)</Form.Label>
                <Form.Control
                  type="number"
                  name="battery"
                  value={formData.battery}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                />
              </Form.Group>

              <div className="d-flex gap-2">
                <Button
                  variant="info"
                  onClick={handleTripPrediction}
                  className="flex-fill fw-bold"
                  disabled={loading}
                >
                  {loading ? "Calculating..." : "⚡ Get Prediction"}
                </Button>
                {editMode && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowModal(false);
                      setEditMode(false);
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}