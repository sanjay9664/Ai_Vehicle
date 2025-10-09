
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Table,
  Spinner,
  Modal,
  Button,
  Pagination,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

// Import API services
import { vehicleHistoryAPI } from '../services/VehicleInfoService';

export default function VehicleHistoryUI() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Fetch list of vehicles using API service
  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const data = await vehicleHistoryAPI.getAllVehicleHistory();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      setVehicles([]); // fallback empty array
    } finally {
      setLoading(false);
    }
  };

  // Fetch single vehicle details using API service
  const fetchVehicleDetail = async (id) => {
    setLoading(true);
    try {
      const data = await vehicleHistoryAPI.getVehicleHistoryById(id);
      setSelectedVehicle(data);
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching vehicle detail:", error);
      setSelectedVehicle(null); // fallback on error
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = vehicles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(vehicles.length / itemsPerPage);

  // Human-friendly labels
  const headerLabels = {
    clientId: "Client ID",
    vehicleNum: "Vehicle Number",
    weekEnding: "Week Ending Date",
    totDistanceUsed: "Total Distance (km)",
    totSocDropUsed: "Battery Used",
    numTripsUsed: "Number of Trips",
    range: "Estimated Range (km)",
  };

  // Table headers
  const tableHeaders =
    vehicles.length > 0
      ? Object.keys(vehicles[0]).filter((key) => key !== "id" && key !== "_id")
      : [];

  // Format date to human-readable
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Format numbers with proper units
  const formatNumber = (value, unit = "") => {
    if (value === null || value === undefined) return "N/A";
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue)) return value;
    
    if (unit === "km") {
      return `${numValue.toFixed(2)} km`;
    } else if (unit === "") {
      return `${numValue.toFixed(1)}`;
    } else {
      return numValue.toString();
    }
  };

  return (
    <Container
      fluid
      className="mt-4 p-4 futuristic-bg text-light"
      style={{
        minHeight: "100vh",
        borderRadius: "20px",
      }}
    >
      <Row>
        <Col>
          <h3 className="mb-4 text-center futuristic-title">
            🚘 Vehicle History
          </h3>

          {loading && vehicles.length === 0 && (
            <div className="text-center">
              <Spinner animation="border" variant="light" className="mb-3" />
              <p>Loading vehicle history data...</p>
            </div>
          )}

          {!loading && vehicles.length === 0 && (
            <div className="text-center p-4">
              <p className="text-warning">No vehicle history data available</p>
              <Button variant="outline-info" onClick={fetchVehicles}>
                🔄 Retry
              </Button>
            </div>
          )}

          {!loading && vehicles.length > 0 && (
            <div className="glass-card p-3">
              <Table
                striped
                bordered
                hover
                responsive
                className="shadow-lg futuristic-table"
              >
                <thead>
                  <tr>
                    {tableHeaders.map((key, index) => (
                      <th key={index} className="text-center">
                        {headerLabels[key] || key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      onClick={() => fetchVehicleDetail(row.id || row._id)}
                      style={{ cursor: "pointer" }}
                      className="hover-row"
                    >
                      {tableHeaders.map((key, colIndex) => (
                        <td key={colIndex} className="text-center">
                          {key === "weekEnding"
                            ? formatDate(row[key])
                            : key === "totDistanceUsed"
                            ? formatNumber(row[key], "km")
                            : key === "totSocDropUsed"
                            ? formatNumber(row[key], "")
                            : key === "range"
                            ? formatNumber(row[key], "km")
                            : typeof row[key] === "object"
                            ? JSON.stringify(row[key])
                            : row[key]?.toString() || "N/A"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {vehicles.length > itemsPerPage && (
            <div className="d-flex justify-content-center mt-3">
              <Pagination className="futuristic-pagination">
                <Pagination.Prev 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                />
                
                {[...Array(totalPages)].map((_, index) => (
                  <Pagination.Item
                    key={index + 1}
                    active={index + 1 === currentPage}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </Pagination.Item>
                ))}
                
                <Pagination.Next 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}

          {/* Show current page info */}
          {vehicles.length > 0 && (
            <div className="text-center mt-2 text-muted">
              <small>
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, vehicles.length)} of {vehicles.length} records
              </small>
            </div>
          )}
        </Col>
      </Row>

      {/* Modal for details */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        scrollable
        className="futuristic-modal"
      >
        <Modal.Header closeButton className="glass-header">
          <Modal.Title className="text-white">📊 Vehicle History Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="glass-body text-white">
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading details...</p>
            </div>
          ) : selectedVehicle ? (
            <Table
              striped
              bordered
              hover
              responsive
              className="futuristic-table"
            >
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(selectedVehicle)
                  .filter((key) => key !== "id" && key !== "_id")
                  .map((key, index) => (
                    <tr key={index}>
                      <td className="fw-bold">{headerLabels[key] || key}</td>
                      <td>
                        {key === "weekEnding"
                          ? formatDate(selectedVehicle[key])
                          : key === "totDistanceUsed"
                          ? formatNumber(selectedVehicle[key], "km")
                          : key === "totSocDropUsed"
                          ? formatNumber(selectedVehicle[key], "")
                          : key === "range"
                          ? formatNumber(selectedVehicle[key], "km")
                          : typeof selectedVehicle[key] === "object"
                          ? JSON.stringify(selectedVehicle[key])
                          : selectedVehicle[key]?.toString() || "N/A"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center text-muted">
              <p>No details available for this vehicle</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="glass-footer">
          <Button variant="outline-light" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="info" onClick={fetchVehicles}>
            Refresh Data
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Custom CSS */}
      <style jsx>{`
        .futuristic-bg {
          background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
          color: #e0e0e0;
        }
        .futuristic-title {
          font-size: 2rem;
          font-weight: bold;
          color: #ffffff;
          text-shadow: 0px 0px 8px #00ffff;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 15px;
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #e0e0e0;
        }
        .futuristic-table thead {
          background: rgba(0, 255, 255, 0.15);
          color: #00ffff;
        }
        .futuristic-table tbody {
          color: #e0e0e0;
        }
        .hover-row:hover {
          background: rgba(0, 255, 255, 0.1);
          color: #00eaff;
          transition: 0.3s;
          transform: scale(1.01);
        }
        .futuristic-pagination .page-item.active .page-link {
          background-color: cyan;
          border-color: cyan;
          color: black;
          font-weight: bold;
          box-shadow: 0px 0px 10px cyan;
        }
        .futuristic-pagination .page-link {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #e0e0e0;
        }
        .futuristic-pagination .page-link:hover {
          background: cyan;
          color: black;
        }
        .futuristic-modal .modal-content {
          background: rgba(0, 0, 0, 0.7);
          border-radius: 15px;
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #e0e0e0;
        }
        .glass-header,
        .glass-footer {
          border: none;
          background: transparent;
          color: #e0e0e0;
        }
      `}</style>

      {/* Inline CSS for better compatibility */}
      <style>{`
        .hover-row:hover {
          background: rgba(0, 255, 255, 0.1) !important;
          color: #00eaff !important;
          transition: all 0.3s ease !important;
          transform: scale(1.01) !important;
        }
        .futuristic-table {
          font-size: 0.9rem;
        }
        .modal-content {
          font-size: 0.9rem;
        }
        .page-link {
          font-size: 0.85rem;
        }
      `}</style>

      
    </Container>
  );
}