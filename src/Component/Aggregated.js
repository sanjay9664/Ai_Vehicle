// src/Component/Dashboard.js

import React, { useState, useEffect } from 'react';
import { 
  FaCar, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaUsers, 
  FaServer,
  FaSync,
  FaChartLine,
  FaBatteryHalf,
  FaRoad,
  FaCalendarCheck,
  FaCalendarTimes
} from 'react-icons/fa';
import { 
  Spinner, 
  Card, 
  Badge, 
  Table,
  Alert,
  Tabs,
  Tab,
  Modal,
  Button
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Import API services - CORRECTED IMPORT
import { dashboardAPI } from '../services/apiServiceAggregated';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
  const [vehicleStats, setVehicleStats] = useState({ 
    totalVehicles: 0, 
    activeVehicles: 0, 
    inactiveVehicles: 0 
  });
  const [dailyWorkHours, setDailyWorkHours] = useState([]);
  const [batteryWarranty, setBatteryWarranty] = useState({
    total: 0,
    warrantyValid: 0,
    warrantyExpiredNumber: 0,
    batteryWarranties: []
  });
  const [averageOdometerNonStrict, setAverageOdometerNonStrict] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState({ 
    vehiclestats: 'Loading...', 
    dailyHours: 'Loading...',
    batteryWarranty: 'Loading...',
    averageOdometer: 'Loading...'
  });
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modal states for odometer details
  const [showOdometerModal, setShowOdometerModal] = useState(false);
  const [selectedOdometerDate, setSelectedOdometerDate] = useState(null);
  const [selectedStrictData, setSelectedStrictData] = useState(null);
  const [loadingStrictData, setLoadingStrictData] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching dashboard data...');

      // Fetch all data individually to handle different API structures
      const [vehicleStatsData, dailyWorkHoursData, batteryWarrantyData, odometerNonStrictData] = await Promise.all([
        dashboardAPI.getVehicleStats(),
        dashboardAPI.getDailyWorkHours(),
        dashboardAPI.getBatteryWarranty(),
        dashboardAPI.getAverageOdometer(false)
      ]);

      console.log('✅ Dashboard data fetched:', { 
        vehicleStatsData, 
        dailyWorkHoursData, 
        batteryWarrantyData, 
        odometerNonStrictData 
      });

      // Set vehicle stats with proper fallback values
      setVehicleStats({
        totalVehicles: vehicleStatsData?.totalVehicles || 0,
        activeVehicles: vehicleStatsData?.activeVehicles || 0,
        inactiveVehicles: vehicleStatsData?.inactiveVehicles || 0
      });

      // Set daily work hours (ensure it's an array)
      setDailyWorkHours(Array.isArray(dailyWorkHoursData) ? dailyWorkHoursData : []);

      // Set battery warranty data - handle different response formats
      const warrantyData = batteryWarrantyData || {};
      setBatteryWarranty({
        total: warrantyData.total || 0,
        warrantyValid: warrantyData.warrantyValid || 0,
        warrantyExpiredNumber: warrantyData.warrantyExpiredNumber || 0,
        batteryWarranties: Array.isArray(warrantyData.batteryWarranties) ? warrantyData.batteryWarranties : []
      });

      // Set average odometer non-strict data
      setAverageOdometerNonStrict(Array.isArray(odometerNonStrictData) ? odometerNonStrictData : []);

      // Update API status
      setApiStatus({
        vehiclestats: '✅ Connected',
        dailyHours: '✅ Connected',
        batteryWarranty: '✅ Connected',
        averageOdometer: '✅ Connected'
      });

      setLastUpdated(new Date());

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      
      // Set API status to error
      setApiStatus({
        vehiclestats: '❌ Error',
        dailyHours: '❌ Error',
        batteryWarranty: '❌ Error',
        averageOdometer: '❌ Error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to handle row click and fetch strict data
  const handleOdometerRowClick = async (date) => {
    try {
      setLoadingStrictData(true);
      setSelectedOdometerDate(date);
      setShowOdometerModal(true);
      
      // Fetch strict data for the selected date
      const strictData = await dashboardAPI.getAverageOdometer(true);
      const selectedDateData = Array.isArray(strictData) 
        ? strictData.find(item => item.date === date)
        : null;
      
      setSelectedStrictData(selectedDateData);
    } catch (error) {
      console.error('Error fetching strict odometer data:', error);
      setSelectedStrictData(null);
    } finally {
      setLoadingStrictData(false);
    }
  };

  // StatCard Component
  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <div className="col-xl-3 col-lg-4 col-md-6 mb-4">
      <Card className={`h-100 shadow-sm border-0 bg-${color} text-white`}>
        <Card.Body className="d-flex justify-content-between align-items-center p-4">
          <div className="flex-grow-1">
            <h6 className="card-subtitle mb-2 opacity-75">{title}</h6>
            <h2 className="card-title mb-1 fw-bold">{value}</h2>
            {subtitle && <small className="opacity-75">{subtitle}</small>}
          </div>
          <div className="icon-container bg-white bg-opacity-25 rounded-circle p-3">
            {icon}
          </div>
        </Card.Body>
      </Card>
    </div>
  );

  // Battery Warranty Card Component
  const BatteryWarrantyCard = ({ title, value, icon, color, subtitle, isBoolean = false }) => (
    <div className="col-xl-3 col-lg-4 col-md-6 mb-4">
      <Card className={`h-100 shadow-sm border-0 bg-${color} text-white`}>
        <Card.Body className="d-flex justify-content-between align-items-center p-4">
          <div className="flex-grow-1">
            <h6 className="card-subtitle mb-2 opacity-75">{title}</h6>
            <h2 className="card-title mb-1 fw-bold">
              {isBoolean ? (value ? 'Yes' : 'No') : value}
            </h2>
            {subtitle && <small className="opacity-75">{subtitle}</small>}
          </div>
          <div className="icon-container bg-white bg-opacity-25 rounded-circle p-3">
            {icon}
          </div>
        </Card.Body>
      </Card>
    </div>
  );

  // Loading State
  if (loading && !lastUpdated) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-dark text-white">
        <div className="text-center">
          <Spinner animation="border" variant="info" size="lg" className="mb-3" />
          <h5>Loading Dashboard...</h5>
          <p className="text-muted">Fetching real-time vehicle data</p>
        </div>
      </div>
    );
  }

  // Prepare Work Hours Chart data
  const workHoursChartData = {
    labels: dailyWorkHours.map(d => {
      try {
        return new Date(d.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      } catch {
        return 'Invalid Date';
      }
    }),
    datasets: [
      {
        label: 'Total Working Hours',
        data: dailyWorkHours.map(d => d.totalWorkingHours || 0),
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0, 212, 255, 0.2)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 8,
        borderWidth: 2
      },
      {
        label: 'Average Work Hours',
        data: dailyWorkHours.map(d => d.averageWorkHours || 0),
        borderColor: '#ff4f81',
        backgroundColor: 'rgba(255, 79, 129, 0.2)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 8,
        borderWidth: 2
      }
    ]
  };

  // Prepare Odometer Chart data
  const odometerChartData = {
    labels: averageOdometerNonStrict.map(d => {
      try {
        return new Date(d.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      } catch {
        return 'Invalid Date';
      }
    }),
    datasets: [
      {
        label: 'Average Distance (km)',
        data: averageOdometerNonStrict.map(d => d.averageDistance || 0),
        borderColor: '#4ecdc4',
        backgroundColor: 'rgba(78, 205, 196, 0.2)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 8,
        borderWidth: 2
      }
    ]
  };

  // Prepare Battery Warranty Pie Chart data
  const batteryPieChartData = {
    labels: ['Warranty Valid', 'Warranty Expired'],
    datasets: [
      {
        data: [batteryWarranty.warrantyValid, batteryWarranty.warrantyExpiredNumber],
        backgroundColor: [
          'rgba(40, 167, 69, 0.8)',
          'rgba(220, 53, 69, 0.8)'
        ],
        borderColor: [
          'rgba(40, 167, 69, 1)',
          'rgba(220, 53, 69, 1)'
        ],
        borderWidth: 2,
        hoverOffset: 15
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#fff',
          font: { weight: 'bold' },
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#666',
        borderWidth: 1
      },
      title: {
        display: true,
        text: 'Daily Metrics Trend',
        color: '#fff',
        font: { size: 16, weight: 'bold' }
      }
    },
    scales: {
      x: {
        ticks: { color: '#fff' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        ticks: { color: '#fff' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        beginAtZero: true
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#fff',
          font: { weight: 'bold' },
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#666',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Odometer Modal Component
  const OdometerModal = () => (
    <Modal 
      show={showOdometerModal} 
      onHide={() => setShowOdometerModal(false)}
      centered
      size="lg"
    >
      <Modal.Header 
        closeButton 
        className="text-white border-0"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e, #0f3460)'
        }}
      >
        <Modal.Title>
          <FaRoad className="me-2" />
          Odometer Details - {selectedOdometerDate ? formatDate(selectedOdometerDate) : 'Loading...'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-dark text-white">
        {loadingStrictData ? (
          <div className="text-center p-4">
            <Spinner animation="border" variant="info" />
            <p className="mt-2">Loading detailed odometer data...</p>
          </div>
        ) : selectedStrictData ? (
          <div className="row">
            <div className="col-12">
              <Card className="border-0 bg-secondary text-white">
                <Card.Body>
                  <h5 className="mb-3">Strict Odometer Data</h5>
                  <div className="row">
                    <div className="col-md-6">
                      <p><strong>Date:</strong> {formatDate(selectedStrictData.date)}</p>
                      <p><strong>Average Distance:</strong> {selectedStrictData.averageDistance?.toFixed(2)} km</p>
                    </div>
                    <div className="col-md-6">
                      <p><strong>Data Type:</strong> Strict Validation</p>
                      <p><strong>Status:</strong> 
                        <Badge bg={selectedStrictData.averageDistance >= 100 ? 'success' : 'warning'} className="ms-2">
                          {selectedStrictData.averageDistance >= 100 ? 'High' : 'Normal'}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
              
              {/* Comparison with Non-Strict Data */}
              <Card className="border-0 bg-dark text-white mt-3">
                <Card.Body>
                  <h6 className="mb-3">Data Comparison</h6>
                  <Table className="table-dark">
                    <thead>
                      <tr>
                        <th>Data Type</th>
                        <th>Average Distance</th>
                        <th>Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Non-Strict</td>
                        <td>
                          {averageOdometerNonStrict
                            .find(item => item.date === selectedOdometerDate)?.averageDistance?.toFixed(2) || 'N/A'} km
                        </td>
                        <td>-</td>
                      </tr>
                      <tr>
                        <td>Strict</td>
                        <td>{selectedStrictData.averageDistance?.toFixed(2)} km</td>
                        <td>
                          {(() => {
                            const nonStrict = averageOdometerNonStrict
                              .find(item => item.date === selectedOdometerDate)?.averageDistance || 0;
                            const strict = selectedStrictData.averageDistance || 0;
                            const diff = strict - nonStrict;
                            return (
                              <span className={diff >= 0 ? 'text-success' : 'text-danger'}>
                                {diff >= 0 ? '+' : ''}{diff.toFixed(2)} km
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center p-4">
            <FaExclamationTriangle size={48} className="text-warning mb-3" />
            <h5>No Detailed Data Available</h5>
            <p>Could not load strict odometer data for the selected date.</p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="bg-dark border-0">
        <Button variant="secondary" onClick={() => setShowOdometerModal(false)}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );

  return (
    <div className="dashboard-container bg-dark text-white min-vh-100 p-3">
      {/* Header Section */}
      <Card className="mb-4 border-0 shadow">
        <Card.Body 
          style={{
            background: 'linear-gradient(90deg, #1b2123ff, #09394eff, #2c5364)',
            color:"#fff",
            borderRadius: '12px'
          }}
        >
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div className="mb-2 mb-md-0">
              <h2 className="mb-1">
                <FaCar className="me-2" /> Vehicle Dashboard
              </h2>
              <small className="opacity-75">
                Real-time fleet monitoring and analytics
              </small>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <Badge bg="success" className="d-flex align-items-center">
                <FaServer className="me-1" /> Stats: {apiStatus.vehiclestats}
              </Badge>
              <Badge bg="info" className="d-flex align-items-center">
                <FaServer className="me-1" /> Hours: {apiStatus.dailyHours}
              </Badge>
              <button 
                onClick={fetchDashboardData}
                className="btn btn-outline-light btn-sm d-flex align-items-center"
                disabled={loading}
              >
                <FaSync className={`me-1 ${loading ? 'fa-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <FaExclamationTriangle className="me-2" />
          {error}
        </Alert>
      )}

      {/* Tabs for different sections */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4 "
        variant=""
      >
        <Tab eventKey="overview" title={
          <>
       
          </>
        }>
          {/* Overview Tab Content */}
          
          {/* Vehicle Stats Section */}
          <div className="row mb-4">
            <StatCard 
              title="Total Vehicles" 
              value={vehicleStats.totalVehicles}
              icon={<FaCar size={24} />}
              color="primary"
              subtitle="Total fleet size"
            />
            
            <StatCard 
              title="Active Vehicles" 
              value={vehicleStats.activeVehicles}
              icon={<FaCheckCircle size={24} />}
              color="success"
              subtitle="Currently operational"
            />
            
            <StatCard 
              title="Inactive Vehicles" 
              value={vehicleStats.inactiveVehicles}
              icon={<FaExclamationTriangle size={24} />}
              color="danger"
              subtitle="Maintenance or offline"
            />
          </div>

          {/* Charts Section */}
          <div className="row">
            {/* Work Hours Chart */}
            <div className="col-12 col-lg-6 mb-4">
              <Card className="shadow-sm border-0 h-100">
                <Card.Body
                  style={{
                    background: 'linear-gradient(135deg, #030349 0%, #0f1740 50%, #16213e 100%)',
                    borderRadius: '16px',
                  }}
                >
                  <div style={{ height: '300px' }}>
                    {dailyWorkHours.length > 0 ? (
                      <Line 
                        data={workHoursChartData} 
                        options={{
                          ...chartOptions,
                          plugins: {
                            ...chartOptions.plugins,
                            title: {
                              ...chartOptions.plugins.title,
                              text: 'Daily Work Hours Trend'
                            }
                          }
                        }} 
                      />
                    ) : (
                      <div className="d-flex justify-content-center align-items-center h-100">
                        <div className="text-center">
                          <FaChartLine size={56} className="mb-3 opacity-75" />
                          <h5 className="text-white">Awaiting Data Stream</h5>
                          <p className="opacity-75 text-white-50">
                            Work hours metrics will appear here
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </div>

            {/* Odometer Chart */}
            <div className="col-12 col-lg-6 mb-4">
              <Card className="shadow-sm border-0 h-100">
                <Card.Body
                  style={{
                    background: 'linear-gradient(135deg, #030349 0%, #0f1740 50%, #16213e 100%)',
                    borderRadius: '16px',
                  }}
                >
                  <div style={{ height: '300px' }}>
                    {averageOdometerNonStrict.length > 0 ? (
                      <Line 
                        data={odometerChartData} 
                        options={{
                          ...chartOptions,
                          plugins: {
                            ...chartOptions.plugins,
                            title: {
                              ...chartOptions.plugins.title,
                              text: 'Average Odometer Trend (Non-Strict)'
                            }
                          }
                        }} 
                      />
                    ) : (
                      <div className="d-flex justify-content-center align-items-center h-100">
                        <div className="text-center">
                          <FaRoad size={56} className="mb-3 opacity-75" />
                          <h5 className="text-white">Awaiting Data Stream</h5>
                          <p className="opacity-75 text-white-50">
                            Odometer metrics will appear here
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>

          {/* Tables Section */}
          <div className="row">
            {/* Work Hours Table */}
            <div className="col-12 col-lg-6 mb-4">
              <Card className="shadow-sm border-0 h-100">
                <Card.Header
                  className="border-0"
                  style={{
                    background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
                    borderRadius: '16px 16px 0 0',
                    color: '#fff',
                    fontWeight: '600'
                  }}
                >
                  <FaUsers className="me-2" />
                  Daily Work Hours
                </Card.Header>
                <Card.Body className="p-0">
                  {dailyWorkHours.length > 0 ? (
                    <div className="table-responsive" style={{ maxHeight: '300px' }}>
                      <Table className="table-dark table-hover mb-0">
                        <thead
                          style={{
                            background: 'linear-gradient(135deg, #222831, #393e46)'
                          }}
                        >
                          <tr>
                            <th>Date</th>
                            <th>Total Hours</th>
                            <th>Avg Hours</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyWorkHours.map((d, i) => (
                            <tr key={i}>
                              <td>{formatDate(d.date)}</td>
                              <td>{(d.totalWorkingHours || 0).toFixed(1)}h</td>
                              <td>{(d.averageWorkHours || 0).toFixed(1)}h</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center p-4 text-muted">
                      <FaUsers size={32} className="mb-2" />
                      <p>No work hours data available</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>

            {/* Odometer Table */}
            <div className="col-12 col-lg-6 mb-4">
              <Card className="shadow-sm border-0 h-100">
                <Card.Header
                  className="border-0"
                  style={{
                    background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
                    borderRadius: '16px 16px 0 0',
                    color: '#fff',
                    fontWeight: '600'
                  }}
                >
                  <FaRoad className="me-2" />
                  Average Odometer (Non-Strict)
                </Card.Header>
                <Card.Body className="p-0">
                  {averageOdometerNonStrict.length > 0 ? (
                    <div className="table-responsive" style={{ maxHeight: '300px' }}>
                      <Table className="table-dark table-hover mb-0">
                        <thead
                          style={{
                            background: 'linear-gradient(135deg, #222831, #393e46)'
                          }}
                        >
                          <tr>
                            <th>Date</th>
                            <th>Average Distance (km)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {averageOdometerNonStrict.map((d, i) => (
                            <tr 
                              key={i} 
                              onClick={() => handleOdometerRowClick(d.date)}
                              style={{ cursor: 'pointer' }}
                              className="hover-row"
                            >
                              <td>{formatDate(d.date)}</td>
                              <td>{(d.averageDistance || 0).toFixed(2)} km</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center p-4 text-muted">
                      <FaRoad size={32} className="mb-2" />
                      <p>No odometer data available</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          </div>

          {/* Battery Warranty Section - Daily Work Hours table ke niche */}
          <div className="row mt-4">
            <div className="col-12">
              <Card className="shadow-sm border-0 mb-4"
                style={{
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 54px 55px, rgba(0, 0, 0, 0.12) 0px -12px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px, rgba(0, 0, 0, 0.17) 0px 12px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px'
      }}>
                <Card.Header
                  className="border-0"
                  style={{
                    background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
                    borderRadius: '16px 16px 0 0',
                    color: '#fff',
                    fontWeight: '600'
                  }}
                >
                  <FaBatteryHalf className="me-2" />
                  Battery Warranty Overview
                </Card.Header>
                <Card.Body>
                  {/* Battery Stats Cards */}
                  <div className="row mb-4">
                    <BatteryWarrantyCard 
                      title="Total Batteries" 
                      value={batteryWarranty.total}
                      icon={<FaBatteryHalf size={24} />}
                      color="primary"
                      subtitle="Total battery count"
                    />
                    
                    <BatteryWarrantyCard 
                      title="Warranty Valid" 
                      value={batteryWarranty.warrantyValid}
                      icon={<FaCalendarCheck size={24} />}
                      color="success"
                      subtitle="Active warranties"
                    />
                    
                    <BatteryWarrantyCard 
                      title="Warranty Expired" 
                      value={batteryWarranty.warrantyExpiredNumber}
                      icon={<FaCalendarTimes size={24} />}
                      color="danger"
                      subtitle="Expired warranties"
                    />
                    
                    <BatteryWarrantyCard 
                      title="Warranty Coverage" 
                      value={`${((batteryWarranty.warrantyValid / batteryWarranty.total) * 100 || 0).toFixed(1)}%`}
                      icon={<FaCheckCircle size={24} />}
                      color="info"
                      subtitle="Active coverage rate"
                    />
                  </div>

                  {/* Battery Charts */}
                  <div className="row">
                    <div className="col-12 col-lg-6 mb-4">
                      <Card className="shadow-sm border-0 h-100">
                        <Card.Body
                          style={{
                            background: 'linear-gradient(135deg, #030349 0%, #0f1740 50%, #16213e 100%)',
                            borderRadius: '16px',
                          }}
                        >
                          <h5 className="text-center text-white mb-3">Battery Warranty Distribution</h5>
                          <div style={{ height: '300px' }}>
                            {batteryWarranty.total > 0 ? (
                              <Pie 
                                data={batteryPieChartData} 
                                options={pieChartOptions} 
                              />
                            ) : (
                              <div className="d-flex justify-content-center align-items-center h-100">
                                <div className="text-center">
                                  <FaBatteryHalf size={56} className="mb-3 opacity-75" />
                                  <h5 className="text-white">No Battery Data</h5>
                                  <p className="opacity-75 text-white-50">
                                    Battery warranty data will appear here
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    </div>

                    <div className="col-12 col-lg-6 mb-4">
                      <Card className="shadow-sm border-0 h-100">
                        <Card.Body
                          style={{
                            background: 'linear-gradient(135deg, #030349 0%, #0f1740 50%, #16213e 100%)',
                            borderRadius: '16px',
                          }}
                        >
                          <h5 className="text-center text-white mb-3">Warranty Status Overview</h5>
                          <div style={{ height: '300px' }} className="d-flex align-items-center justify-content-center">
                            {batteryWarranty.total > 0 ? (
                              <div className="text-center">
                                <div className="display-4 fw-bold text-success">
                                  {((batteryWarranty.warrantyValid / batteryWarranty.total) * 100).toFixed(1)}%
                                </div>
                                <p className="mt-2 text-white">of batteries under warranty</p>
                                <div className="row mt-4">
                                  <div className="col-6">
                                    <div className="text-success">
                                      <FaCalendarCheck size={32} />
                                      <div className="mt-2">{batteryWarranty.warrantyValid} Active</div>
                                    </div>
                                  </div>
                                  <div className="col-6">
                                    <div className="text-danger">
                                      <FaCalendarTimes size={32} />
                                      <div className="mt-2">{batteryWarranty.warrantyExpiredNumber} Expired</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="d-flex justify-content-center align-items-center h-100">
                                <div className="text-center">
                                  <FaBatteryHalf size={56} className="mb-3 opacity-75" />
                                  <h5 className="text-white">No Battery Data</h5>
                                </div>
                              </div>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>

                  {/* Battery Warranty Table */}
                  <div className="row">
                    <div className="col-12">
                      <Card className="shadow-sm border-0">
                        <Card.Header
                          className="border-0"
                          style={{
                            background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
                            borderRadius: '16px 16px 0 0',
                            color: '#fff',
                            fontWeight: '600'
                          }}
                        >
                          <FaBatteryHalf className="me-2" />
                          Battery Warranty Details
                        </Card.Header>
                        <Card.Body className="p-0">
                          {batteryWarranty.batteryWarranties.length > 0 ? (
                            <div className="table-responsive">
                              <Table className="table-dark table-hover mb-0">
                                <thead
                                  style={{
                                    background: 'linear-gradient(135deg, #222831, #393e46)'
                                  }}
                                >
                                  <tr>
                                    <th>Battery ID</th>
                                    <th>Vehicle Number</th>
                                    <th>Warranty Date</th>
                                    <th>Warranty Expired</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {batteryWarranty.batteryWarranties.map((battery, i) => (
                                    <tr key={i}>
                                      <td>
                                        <strong>{battery.batteryId}</strong>
                                      </td>
                                      <td>{battery.vehicleNum}</td>
                                      <td>{formatDate(battery.warrantyDate)}</td>
                                      <td>
                                        {battery.warrantyExpired ? 'Yes' : 'No'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </div>
                          ) : (
                            <div className="text-center p-4 text-muted">
                              <FaBatteryHalf size={32} className="mb-2" />
                              <p>No battery warranty data available</p>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
        </Tab>
      </Tabs>

      {/* Odometer Modal */}
      <OdometerModal />

      {/* Footer */}
      <div className="text-center mt-4">
        <small className="text-muted">
          {lastUpdated ? (
            <>
              Last updated: {lastUpdated.toLocaleString()} | 
              Auto-refreshes every 5 minutes
            </>
          ) : (
            'Loading...'
          )}
        </small>
      </div>

      <style jsx>{`
        .custom-tabs .nav-pills .nav-link {
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          color: #fff;
          border: 1px solid #333;
          margin-right: 8px;
          border-radius: 8px;
        }
        .custom-tabs .nav-pills .nav-link {
          background: linear-gradient(135deg, #00d4ff, #0f3460);
          color: #fff;
          border-color: #00d4ff;
        }
        .custom-tabs .nav-pills .nav-link:hover {
          background: linear-gradient(135deg, #0f3460, #1a1a2e);
          color: #fff;
        }
        .hover-row:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;