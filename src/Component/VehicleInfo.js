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

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://192.168.68.135:8088/api/vehicleHistory");
      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleDetail = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://192.168.68.135:8088/api/vehicleHistory/${id}`
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

  // Table headers
  const tableHeaders =
    vehicles.length > 0
      ? Object.keys(vehicles[0]).filter((key) => key !== "id" && key !== "_id")
      : [];

  // Human-friendly labels
  const headerLabels = {
    clientId: "Client ID",
    vehicleNum: "Vehicle Number",
    weekEnding: "Week Ending Date",
    totDistanceUsed: "Total Distance (km)",
    totSocDropUsed: "Battery Used ",
    numTripsUsed: "Number of Trips",
    range: "Estimated Range (km)",
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

          {loading && (
            <Spinner animation="border" variant="light" className="d-block mx-auto" />
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
                          {typeof row[key] === "object"
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
              <Pagination className="futuristic-pagination">
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
        className="futuristic-modal"
      >
        <Modal.Header closeButton className="glass-header">
          <Modal.Title className="text-white">Vehicle Detail</Modal.Title>
        </Modal.Header>
        <Modal.Body className="glass-body text-white">
          {selectedVehicle ? (
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
                      <td>{headerLabels[key] || key}</td>
                      <td>
                        {typeof selectedVehicle[key] === "object"
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
        <Modal.Footer className="glass-footer">
          <Button variant="outline-light" onClick={() => setShowModal(false)}>
            Close
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
        .futuristic-table tbody tr:hover {
          background: rgba(0, 255, 255, 0.1);
          color: #00eaff;
          transition: 0.3s;
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
    </Container>
  );
}
