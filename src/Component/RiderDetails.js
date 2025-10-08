// src/Component/RiderDetails.js

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
import { riderScoreAPI } from '../services/apiSService';

export default function RiderDetails() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRider, setSelectedRider] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchRiders();
  }, []);

  // Fetch list of riders using API service
  const fetchRiders = async () => {
    setLoading(true);
    try {
      const data = await riderScoreAPI.getAllRiderScores();
      setRiders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching riders:", error);
      setRiders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single rider details using API service
  const fetchRiderDetail = async (id) => {
    setLoading(true);
    try {
      const data = await riderScoreAPI.getRiderScoreById(id);
      setSelectedRider(data);
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching rider detail:", error);
      setSelectedRider(null);
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = riders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(riders.length / itemsPerPage);

  // Human-friendly labels
  const headerLabels = {
    clientId: "Client ID",
    vehicleNum: "Vehicle Number",
    timestamp: "Date",
    riderCategory: "Category",
    accelMean: "Avg Accel",
    harshRate: "Harsh Events",
    avgSpeed: "Avg Speed",
    numTrips: "Trips",
    accelRating: "Accel Rating",
    harshRating: "Harsh Rating",
    speedRating: "Speed Rating",
  };

  // Table headers
  const tableHeaders =
    riders.length > 0
      ? Object.keys(riders[0]).filter((key) => key !== "id" && key !== "_id")
      : [];

  // Format timestamp
  const formatTimestamp = (ts) => {
    if (!ts) return "N/A";
    try {
      const date = new Date(ts);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return ts;
    }
  };

  // Format numbers with proper units
  const formatNumber = (value, unit = "") => {
    if (value === null || value === undefined) return "N/A";
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue)) return value;
    
    if (unit === "km/h") {
      return `${numValue.toFixed(1)} km/h`;
    } else if (unit === "m/s²") {
      return `${numValue.toFixed(2)} m/s²`;
    } else if (unit === "events") {
      return `${numValue} events`;
    } else {
      return numValue.toString();
    }
  };

  return (
    <Container fluid className="mt-4 p-4 bg-black text-white">
      <Row>
        <Col>
          <h3 className="mb-4 text-center text-white">🚵 Rider Details</h3>

          {loading && riders.length === 0 && (
            <div className="text-center">
              <Spinner animation="border" variant="light" className="mb-3" />
              <p className="text-white">Loading rider data...</p>
            </div>
          )}

          {!loading && riders.length === 0 && (
            <div className="text-center p-4">
              <p className="text-white">No rider data available</p>
              <Button variant="outline-light" onClick={fetchRiders}>
                Retry
              </Button>
            </div>
          )}

          {!loading && riders.length > 0 && (
            <div className="p-3">
              <Table bordered hover responsive variant="dark" className="bg-black">
                <thead>
                  <tr>
                    {tableHeaders.map((key, index) => (
                      <th key={index} className="text-center border border-white">
                        {headerLabels[key] || key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      onClick={() => fetchRiderDetail(row.id || row._id)}
                      style={{ cursor: "pointer" }}
                    >
                      {tableHeaders.map((key, colIndex) => (
                        <td key={colIndex} className="text-center border border-white">
                          {key === "timestamp" ? (
                            formatTimestamp(row[key])
                          ) : key === "accelMean" ? (
                            formatNumber(row[key], "m/s²")
                          ) : key === "avgSpeed" ? (
                            formatNumber(row[key], "km/h")
                          ) : key === "harshRate" ? (
                            formatNumber(row[key], "events")
                          ) : typeof row[key] === "object" ? (
                            JSON.stringify(row[key])
                          ) : (
                            row[key]?.toString() || "N/A"
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {riders.length > itemsPerPage && (
            <div className="d-flex justify-content-center mt-3">
              <Pagination>
                <Pagination.Prev 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="bg-dark text-white border-white"
                />
                
                {[...Array(totalPages)].map((_, index) => (
                  <Pagination.Item
                    key={index + 1}
                    active={index + 1 === currentPage}
                    onClick={() => setCurrentPage(index + 1)}
                    className="bg-dark text-white border-white"
                  >
                    {index + 1}
                  </Pagination.Item>
                ))}
                
                <Pagination.Next 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="bg-dark text-white border-white"
                />
              </Pagination>
            </div>
          )}

          {/* Show current page info */}
          {riders.length > 0 && (
            <div className="text-center mt-2 text-white">
              <small>
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, riders.length)} of {riders.length} records
              </small>
            </div>
          )}
        </Col>
      </Row>

      {/* Modal for details - Simple Table Format */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        scrollable
        className="text-white"
      >
        <Modal.Header closeButton className="bg-black text-white border-white">
          <Modal.Title>Rider Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-black text-white">
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" variant="light" />
              <p className="mt-2">Loading details...</p>
            </div>
          ) : selectedRider ? (
            <Table bordered responsive variant="dark" className="bg-black">
              <tbody>
                {Object.keys(selectedRider)
                  .filter((key) => key !== "id" && key !== "_id")
                  .map((key, index) => (
                    <tr key={index}>
                      <td className="fw-bold border border-white p-2" style={{width: '40%'}}>
                        {headerLabels[key] || key}
                      </td>
                      <td className="border border-white p-2" style={{width: '60%'}}>
                        {key === "timestamp" ? (
                          formatTimestamp(selectedRider[key])
                        ) : key === "accelMean" ? (
                          formatNumber(selectedRider[key], "m/s²")
                        ) : key === "avgSpeed" ? (
                          formatNumber(selectedRider[key], "km/h")
                        ) : key === "harshRate" ? (
                          formatNumber(selectedRider[key], "events")
                        ) : typeof selectedRider[key] === "object" ? (
                          JSON.stringify(selectedRider[key])
                        ) : (
                          selectedRider[key]?.toString() || "N/A"
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center text-white">
              <p>No details available for this rider</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-black border-white">
          <Button variant="outline-light" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Simple CSS for black background and white text */}
      <style>{`
        body {
          background-color: black;
        }
        .bg-black {
          background-color: #000000 !important;
        }
        .table-dark {
          background-color: #000000;
          color: white;
        }
        .table-dark th,
        .table-dark td {
          border-color: white !important;
          background-color: #000000;
          font-size: smaller;
        }
        .modal-content {
          background-color: #000000;
          border: 1px solid white;
        }
        .page-link {
          background-color: #000000;
          border-color: white;
          color: white;
        }
        .page-item.active .page-link {
          background-color: #333333;
          border-color: white;
        }
        .btn-outline-light {
          border-color: white;
          color: white;
        }
        .btn-outline-light:hover {
          background-color: white;
          color: black;
        }
      `}</style>
    </Container>
  );
}