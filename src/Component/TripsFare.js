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

  // Fetch list of vehicles
  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://192.168.68.135:8088/api/theftdetection");
      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single vehicle details
  const fetchVehicleDetail = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://192.168.68.135:8088/api/theftdetection/${id}`
      );
      const data = await res.json();
      setSelectedVehicle(data);
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching vehicle detail:", error);
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

  return (
    <Container fluid className="mt-4 p-4 bg-dark text-light rounded">
      <Row>
        <Col>
          <h3 className="mb-4 text-center text-info">🤖THEFTDETECTION</h3>

          {loading && (
            <Spinner animation="border" variant="light" className="d-block mx-auto" />
          )}

          {!loading && vehicles.length > 0 && (
            <div className="p-3 bg-secondary bg-opacity-25 rounded text-center">
              <Table striped bordered hover responsive variant="dark">
                <thead>
                  <tr>
                    {tableHeaders.map((key, index) => (
                      <th key={index}>{headerLabels[key] || key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      onClick={() => fetchVehicleDetail(row.id || row._id)}
                      style={{ cursor: "pointer" }}
                    >
                      {tableHeaders.map((key, colIndex) => (
                        <td key={colIndex}>
                          {key === "timestamp"
                            ? formatTimestamp(row[key])
                            : typeof row[key] === "object"
                            ? JSON.stringify(row[key])
                            : row[key]?.toString()}
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
                {[...Array(totalPages)].map((_, index) => (
                  <Pagination.Item
                    key={index + 1}
                    active={index + 1 === currentPage}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </Pagination.Item>
                ))}
              </Pagination>
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
      >
        <Modal.Header closeButton>
          <Modal.Title>Vehicle Detail</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedVehicle ? (
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
                    <tr key={index}>
                      <td>{headerLabels[key] || key}</td>
                      <td>
                        {key === "timestamp"
                          ? formatTimestamp(selectedVehicle[key])
                          : typeof selectedVehicle[key] === "object"
                          ? JSON.stringify(selectedVehicle[key])
                          : selectedVehicle[key]?.toString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          ) : (
            <p>No details available</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Custom font size for table, modal, pagination */}
      <style jsx>{`
        table {
          font-size: 0.85rem;
        }
        .modal-body {
          font-size: 0.9rem;
        }
        .pagination .page-link {
          font-size: 0.85rem;
        }
      `}</style>
    </Container>
  );
}
