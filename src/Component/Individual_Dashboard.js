// src/Component/Tracking_Ride_Date.js

import React, { useEffect, useState } from "react";
import { Container, Row, Col, Dropdown, Spinner, Card,Button } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Import API services
import { vehiclesAPI, odometerAPI } from '../services/Individual_DashboardService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Tracking_Ride_Date() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartData1, setChartData1] = useState(null);
  const [chartData2, setChartData2] = useState(null);
  const [chartData3, setChartData3] = useState(null);
  const [chartData4, setChartData4] = useState(null);

  // Fetch vehicles on component mount
  useEffect(() => {
    fetchVehicles();
  }, []);

  // Fetch data when vehicle changes
  useEffect(() => {
    if (selectedVehicle) {
      fetchData();
    }
  }, [selectedVehicle]);

  const fetchVehicles = async () => {
    try {
      const vehiclesData = await vehiclesAPI.getAllVehicles();
      setVehicles(vehiclesData);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
    }
  };

  const fetchData = async () => {
    if (!selectedVehicle) return;

    try {
      setLoading(true);

      // Fetch data for both strict modes using API service
      const { strict: apiDataTrue, nonStrict: apiDataFalse } = await odometerAPI.getOdometerDataBothModes(selectedVehicle);

      // Last 7 Date
      const today = new Date();
      const last7Date = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
      });

      // Process data for all charts
      const processChartData = (apiData) => {
        return last7Date.map((day) => {
          const found = apiData.find((item) => item.date === day);
          return {
            date: day,
            distance: found ? found.distanceTravelledInDay : 0,
            odometer: found ? found.odometerReading : 0,
          };
        });
      };

      const mapped1 = processChartData(apiDataTrue);
      const mapped2 = processChartData(apiDataFalse);

      // Set chart data for all 4 charts
      setChartData1({
        labels: mapped1.map((d) => d.date),
        datasets: [
          {
            label: "Distance Travelled (km) - Strict True",
            data: mapped1.map((d) => d.distance),
            borderColor: "#ff6600",
            backgroundColor: "rgba(255, 102, 0, 0.1)",
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: "#ff3300",
            pointBorderColor: "#fff",
            fill: true,
          },
        ],
      });

      setChartData2({
        labels: mapped2.map((d) => d.date),
        datasets: [
          {
            label: "Distance Travelled (km) - Strict False",
            data: mapped2.map((d) => d.distance),
            borderColor: "#00ff88",
            backgroundColor: "rgba(0, 255, 136, 0.1)",
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: "#00cc66",
            pointBorderColor: "#fff",
            fill: true,
          },
        ],
      });

      setChartData3({
        labels: mapped1.map((d) => d.date),
        datasets: [
          {
            label: "Odometer Reading - Strict True",
            data: mapped1.map((d) => d.odometer),
            borderColor: "#3366ff",
            backgroundColor: "rgba(51, 102, 255, 0.1)",
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: "#0044cc",
            pointBorderColor: "#fff",
            fill: true,
            yAxisID: 'y',
          },
          
        ],
      });

      setChartData4({
        labels: mapped2.map((d) => d.date),
        datasets: [
          {
            label: "Odometer Reading - Strict False",
            data: mapped2.map((d) => d.odometer),
            borderColor: "#ffcc00",
            backgroundColor: "rgba(255, 204, 0, 0.1)",
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: "#cc9900",
            pointBorderColor: "#fff",
            fill: true,
            yAxisID: 'y',
          },
         
        ],
      });

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const commonChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        labels: { 
          color: "white",
          font: { size: 12 }
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Date",
          color: "white",
          font: { size: 12, weight: "bold" },
        },
        ticks: { color: "white" },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
      y: {
        title: {
          display: true,
          text: "Distance (km)",
          color: "white",
          font: { size: 12, weight: "bold" },
        },
        beginAtZero: true,
        ticks: { color: "white" },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
    },
  };

  const dualAxisChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        labels: { 
          color: "white",
          font: { size: 12 }
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Date",
          color: "white",
          font: { size: 12, weight: "bold" },
        },
        ticks: { color: "white" },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: "Odometer Reading",
          color: "white",
          font: { size: 12, weight: "bold" },
        },
        beginAtZero: true,
        ticks: { color: "white" },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
     
    },
  };

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  // Helper function to get vehicle name
  const getVehicleName = (vehicle) => {
    if (typeof vehicle === 'object') {
      return vehicle.name || vehicle.vehicleName || vehicle.vehicleNum || `Vehicle ${vehicle.id || vehicle.vehicleId}`;
    }
    return vehicle;
  };

  return (
    <Container
      fluid
      className="mt-4 p-4"
      style={{ background: "#1a1a1a", borderRadius: "12px" }}
    >
      {/* Single Dropdown for Vehicle Selection */}
      <Row className="mb-4">
        <Col className="d-flex justify-content-center">
          <Dropdown>
            <Dropdown.Toggle 
              variant="outline-light" 
              id="vehicle-dropdown"
              style={{ 
                minWidth: "250px",
                borderColor: "#444",
                color: "white",
                fontSize: "16px",
                padding: "10px 20px"
              }}
            >
              {selectedVehicle ? `Selected: ${getVehicleName(selectedVehicle)}` : "Select Vehicle"}
            </Dropdown.Toggle>

            <Dropdown.Menu 
              style={{ 
                background: "#2a2a2a", 
                border: "1px solid #444",
                maxHeight: "300px",
                overflowY: "auto"
              }}
            >
              {vehicles.length === 0 ? (
                <Dropdown.Item style={{ color: "white" }} disabled>
                  Loading vehicles...
                </Dropdown.Item>
              ) : (
                vehicles.map((vehicle, index) => (
                  <Dropdown.Item
                    key={index}
                    onClick={() => handleVehicleSelect(vehicle)}
                    style={{ 
                      color: "white",
                      background: selectedVehicle === vehicle ? "#444" : "transparent",
                      padding: "10px 15px"
                    }}
                    onMouseEnter={(e) => e.target.style.background = "#444"}
                    onMouseLeave={(e) => e.target.style.background = 
                      selectedVehicle === vehicle ? "#444" : "transparent"
                    }
                  >
                    {getVehicleName(vehicle)}
                  </Dropdown.Item>
                ))
              )}
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      {/* Loader */}
      {loading && (
        <Row>
          <Col className="text-center">
            <Spinner animation="border" variant="light" />
            <p className="text-white mt-2">
              Loading data for vehicle {getVehicleName(selectedVehicle)}...
            </p>
          </Col>
        </Row>
      )}

      {/* No Vehicle Selected Message */}
      {!selectedVehicle && !loading && (
        <Row>
          <Col className="text-center">
            <div className="text-white p-4" style={{ background: "#2a2a2a", borderRadius: "8px" }}>
              <h5>Please select a vehicle from dropdown</h5>
              <p>Choose a vehicle to view its tracking data and graphs</p>
            </div>
          </Col>
        </Row>
      )}

      {/* Error Message */}
      {!loading && selectedVehicle && (!chartData1 || !chartData2 || !chartData3 || !chartData4) && (
        <Row>
          <Col className="text-center">
            <div className="text-warning p-4" style={{ background: "#2a2a2a", borderRadius: "8px" }}>
              <h5>No data available for selected vehicle</h5>
              <p>Try selecting a different vehicle or check if data exists for the last 7 Date</p>
              <Button variant="outline-warning" onClick={fetchData}>
                🔄 Retry
              </Button>
            </div>
          </Col>
        </Row>
      )}

      {/* 4 Charts Grid - Show only when vehicle is selected and data is loaded */}
      {!loading && selectedVehicle && chartData1 && chartData2 && chartData3 && chartData4 && (
        <>
          <Row className="mb-4">
            <Col className="text-center">
              <h4 className="text-white mb-2">
                Tracking Data for: <span style={{ color: "#ff6600" }}>{getVehicleName(selectedVehicle)}</span>
              </h4>
              <p className="text-muted">Last 7 Date data</p>
            </Col>
          </Row>
          
          <Row className="g-4">
            {/* Chart 1: Distance Travelled (strict true) */}
            <Col xs={12} md={6}>
              <Card className="chart-card" style={{ background: "#2a2a2a", border: "1px solid #444" }}>
                <Card.Body>
                  <h6 className="text-white text-center mb-3">
                    Distance Travelled (Strict True)
                  </h6>
                  <Line 
                    data={chartData1} 
                    options={commonChartOptions}
                  />
                </Card.Body>
              </Card>
            </Col>

            {/* Chart 2: Distance Travelled (strict false) */}
            <Col xs={12} md={6}>
              <Card className="chart-card" style={{ background: "#2a2a2a", border: "1px solid #444" }}>
                <Card.Body>
                  <h6 className="text-white text-center mb-3">
                    Distance Travelled (Strict False)
                  </h6>
                  <Line 
                    data={chartData2} 
                    options={commonChartOptions}
                  />
                </Card.Body>
              </Card>
            </Col>

            {/* Chart 3: Odometer & Distance (strict true) */}
            <Col xs={12} md={6}>
              <Card className="chart-card" style={{ background: "#2a2a2a", border: "1px solid #444" }}>
                <Card.Body>
                  <h6 className="text-white text-center mb-3">
                    {/* Odometer & Distance (Strict True) */}
                  </h6>
                  <Line 
                    data={chartData3} 
                    options={dualAxisChartOptions}
                  />
                </Card.Body>
              </Card>
            </Col>

            {/* Chart 4: Odometer & Distance (strict false) */}
            <Col xs={12} md={6}>
              <Card className="chart-card" style={{ background: "#2a2a2a", border: "1px solid #444" }}>
                <Card.Body>
                  <h6 className="text-white text-center mb-3">
                    {/* Odometer & Distance (Strict False) */}
                  </h6>
                  <Line 
                    data={chartData4} 
                    options={dualAxisChartOptions}
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
}