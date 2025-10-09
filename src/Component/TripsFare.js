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
  Alert,
  Badge,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

// Import API services
import { theftDetectionAPI } from '../services/TripsFareService';

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
      const data = await theftDetectionAPI.getAllTheftRecords();
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
      const data = await theftDetectionAPI.getTheftRecordById(id);
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
    timestamp: "Date / Time",
    distanceTravelled: "Distance Travelled (km)",
    currentUsed: "Current Used (A)",
    soc: "SOC (%)",
    instanceId: "Instance ID",
    timePeriod: "Time Period",
    theftIndicator: "Theft Alert",
  };

  // Table headers
  const tableHeaders =
    vehicles.length > 0
      ? Object.keys(vehicles[0]).filter((key) => key !== "id" && key !== "_id")
      : [];

  // Format timestamp to human-readable
  const formatTimestamp = (ts) => {
    if (!ts) return "";
    const date = new Date(ts);
    return date.toLocaleString(); // e.g., "25/09/2025, 16:30:00"
  };

  // Check if theft is detected
  const isTheftDetected = (vehicle) => {
    const indicator = vehicle?.theftIndicator;
    return indicator === true || indicator === "true" || indicator === "YES";
  };

  // Format theft indicator with emoji and badge
  const formatTheftIndicator = (indicator) => {
    if (isTheftDetected({ theftIndicator: indicator })) {
      return <Badge bg="danger" className="p-2">🔴 YES</Badge>;
    } else {
      return <Badge bg="success" className="p-2">🟢 NO</Badge>;
    }
  };

  // Get theft status message
  const getTheftStatusMessage = (vehicle) => {
    if (isTheftDetected(vehicle)) {
      return "🚨 Theft Detected. Please take necessary action";
    } else {
      return "✅ All OK. Vehicle is safe";
    }
  };

  return (
    <Container fluid className="mt-4 p-4 bg-dark text-light rounded">
      <Row>
        <Col>
          <h3 className="mb-4 text-center text-info">🤖 THEFT DETECTION</h3>

          {loading && vehicles.length === 0 && (
            <div className="text-center">
              <Spinner animation="border" variant="light" className="mb-2" />
              <p>Loading vehicle data...</p>
            </div>
          )}

          {!loading && vehicles.length === 0 && (
            <div className="text-center p-4">
              <p className="text-warning">No vehicle data available</p>
              <Button variant="outline-info" onClick={fetchVehicles}>
                🔄 Retry
              </Button>
            </div>
          )}

          {!loading && vehicles.length > 0 && (
            <div className="p-3 bg-secondary bg-opacity-25 rounded">
              <Table striped bordered hover responsive variant="dark" size="sm">
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
                      className={`hover-row ${isTheftDetected(row) ? 'theft-detected-row' : ''}`}
                    >
                      {tableHeaders.map((key, colIndex) => (
                        <td key={colIndex} className="text-center">
                          {key === "timestamp"
                            ? formatTimestamp(row[key])
                            : key === "theftIndicator"
                            ? formatTheftIndicator(row[key])
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
              <Pagination>
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
        className="theft-detection-modal"
      >
        <Modal.Header closeButton className={`${selectedVehicle && isTheftDetected(selectedVehicle) ? 'bg-danger text-white' : 'bg-success text-white'}`}>
          <Modal.Title>
            🚗 Vehicle Details
            {selectedVehicle && (
              <Badge bg={isTheftDetected(selectedVehicle) ? "light" : "dark"} className="ms-2">
                {isTheftDetected(selectedVehicle) ? "🚨 ALERT" : "✅ SAFE"}
              </Badge>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading details...</p>
            </div>
          ) : selectedVehicle ? (
            <>
              {/* Theft Alert Message */}
              <Alert variant={isTheftDetected(selectedVehicle) ? "danger" : "success"} className="mb-3">
                <Alert.Heading className="d-flex align-items-center">
                  {isTheftDetected(selectedVehicle) ? "🚨 Theft Alert" : "✅ Vehicle Status"}
                </Alert.Heading>
                <p className="mb-0 fw-bold">
                  {getTheftStatusMessage(selectedVehicle)}
                </p>
                {isTheftDetected(selectedVehicle) && (
                  <>
                    <hr />
                    <div className="d-flex gap-2 flex-wrap">
                      <Button variant="outline-danger" size="sm">
                        🚔 Contact Security
                      </Button>
                      <Button variant="outline-warning" size="sm">
                        📱 Notify Owner
                      </Button>
                      <Button variant="outline-info" size="sm">
                        📍 Track Vehicle
                      </Button>
                    </div>
                  </>
                )}
              </Alert>

              {/* Vehicle Details Table */}
              <Table striped bordered hover responsive>
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
                      <tr key={index} className={key === "theftIndicator" && isTheftDetected(selectedVehicle) ? "table-danger" : ""}>
                        <td className="fw-bold">{headerLabels[key] || key}</td>
                        <td>
                          {key === "timestamp"
                            ? formatTimestamp(selectedVehicle[key])
                            : key === "theftIndicator"
                            ? formatTheftIndicator(selectedVehicle[key])
                            : typeof selectedVehicle[key] === "object"
                            ? JSON.stringify(selectedVehicle[key])
                            : selectedVehicle[key]?.toString() || "N/A"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </Table>

              {/* Additional Information for Theft Cases */}
              {isTheftDetected(selectedVehicle) && (
                <div className="mt-3 p-3 bg-light text-dark rounded">
                  <h6 className="text-danger fw-bold">⚠️ Immediate Actions Required:</h6>
                  <ul className="small mb-0 text-dark">
                    <li className="text-dark">Contact local authorities with vehicle information</li>
                    <li className="text-dark">Notify the registered vehicle owner immediately</li>
                    <li className="text-dark">Check recent GPS location and movement history</li>
                    <li className="text-dark">Review access logs and authentication records</li>
                    <li className="text-dark">Initiate vehicle immobilization procedure if available</li>
                  </ul>
                </div>
              )}

              {/* Safe Vehicle Information */}
              {!isTheftDetected(selectedVehicle) && (
                <div className="mt-3 p-3 bg-light text-dark rounded">
                  <h6 className="text-success fw-bold">ℹ️ Vehicle Status Information:</h6>
                  <ul className="small mb-0 text-dark">
                    <li className="text-dark">Vehicle is operating normally</li>
                    <li className="text-dark">No suspicious activity detected</li>
                    <li className="text-dark">All systems are functioning properly</li>
                    <li className="text-dark">Regular monitoring is active</li>
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-muted">
              <p>No details available for this vehicle</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className={selectedVehicle && isTheftDetected(selectedVehicle) ? 'bg-danger text-white' : 'bg-success text-white'}>
          <Button variant="outline-light" onClick={() => setShowModal(false)}>
            Close
          </Button>
          {selectedVehicle && isTheftDetected(selectedVehicle) && (
            <Button variant="light" className="text-danger fw-bold">
              🚨 Emergency Protocol
            </Button>
          )}
          <Button variant="outline-light" onClick={fetchVehicles}>
            Refresh Data
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Custom Styles */}
      <style jsx>{`
        .hover-row:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          transform: scale(1.01);
          transition: all 0.2s ease;
        }
        .theft-detected-row {
          background-color: rgba(255, 0, 0, 0.1) !important;
          border-left: 3px solid #dc3545;
        }
        .theft-detected-row:hover {
          background-color: rgba(255, 0, 0, 0.2) !important;
          border-left: 3px solid #ff0000;
        }
        table {
          font-size: 0.85rem;
        }
        .modal-body {
          font-size: 0.9rem;
        }
        .pagination .page-link {
          font-size: 0.85rem;
        }
        .text-dark {
          color: #000000 !important;
        }
      `}</style>

      {/* Inline CSS for better compatibility */}
      <style>{`
        .hover-row:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          transform: scale(1.01);
          transition: all 0.2s ease;
        }
        .theft-detected-row {
          background-color: rgba(255, 0, 0, 0.1) !important;
          border-left: 3px solid #dc3545 !important;
        }
        .theft-detected-row:hover {
          background-color: rgba(255, 0, 0, 0.2) !important;
          border-left: 3px solid #ff0000 !important;
        }
        .table-dark {
          font-size: 0.85rem;
        }
        .modal-content {
          font-size: 0.9rem;
        }
        .page-link {
          font-size: 0.85rem;
        }
        .badge {
          font-size: 0.75rem;
          color: black;
        }
        .text-dark {
          color: #000000 !important;
        }
        .bg-light .text-dark {
          color: #000000 !important;
        }
        .bg-light li {
          color: #000000 !important;
        }
      `}</style>
    </Container>
  );
}