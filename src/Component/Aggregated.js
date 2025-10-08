// src/Component/Dashboard.js

import React, { useState, useEffect } from 'react';
import { 
  FaCar, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaUsers, 
  FaServer,
  FaSync,
  FaChartLine
} from 'react-icons/fa';
import { 
  Spinner, 
  Card, 
  Badge, 
  Table,
  Alert 
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Import API services
import { dashboardAPI } from '../services/apiServiceAggregated';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [vehicleStats, setVehicleStats] = useState({ 
    totalVehicles: 0, 
    activeVehicles: 0, 
    inactiveVehicles: 0 
  });
  const [dailyWorkHours, setDailyWorkHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState({ 
    vehiclestats: 'Loading...', 
    dailyHours: 'Loading...' 
  });
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

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

      const { vehicleStats: statsData, dailyWorkHours: workHoursData } = await dashboardAPI.getAllDashboardData();

      console.log('✅ Dashboard data fetched:', { statsData, workHoursData });

      // Set vehicle stats with fallback values
      setVehicleStats({
        totalVehicles: statsData.totalVehicles || 0,
        activeVehicles: statsData.activeVehicles || 0,
        inactiveVehicles: statsData.inactiveVehicles || 0
      });

      // Set daily work hours (ensure it's an array)
      setDailyWorkHours(Array.isArray(workHoursData) ? workHoursData : []);

      // Update API status
      setApiStatus({
        vehiclestats: '✅ Connected',
        dailyHours: '✅ Connected'
      });

      setLastUpdated(new Date());

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      
      // Set API status to error
      setApiStatus({
        vehiclestats: '❌ Error',
        dailyHours: '❌ Error'
      });
    } finally {
      setLoading(false);
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

  // Prepare chart data
  const lineData = {
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

  const lineOptions = {
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
        text: 'Daily Work Hours Trend',
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

  // Get status badge for work hours
  const getWorkHoursStatus = (hours) => {
    if (hours >= 20) return { text: 'High', variant: 'success' };
    if (hours >= 10) return { text: 'Medium', variant: 'warning' };
    return { text: 'Low', variant: 'danger' };
  };

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
              <Badge style={{backgroundColor:"#198754 !important"}} className="d-flex align-items-center">
                <FaServer className="me-1" /> Stats: {apiStatus.vehiclestats}
              </Badge>
              <Badge style={{backgroundColor:"#050e00ff !important"}} className="d-flex align-items-center">
                <FaServer className="me-1"  /> Hours: {apiStatus.dailyHours}
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

      {/* Statistics Cards */}
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
        
        {/* <StatCard 
          title="Daily Records" 
          value={dailyWorkHours.length}
          icon={<FaChartLine size={24} />}
          color="info"
          subtitle="Work hours entries"
        /> */}
      </div>

      {/* Charts and Tables Section */}
    <div className="row">
  {/* Chart Section */}
  <div className="col-12 col-lg-8 mb-4">
    <Card className="shadow-sm border-0 h-100 futuristic-chart-card">
      <Card.Body
        style={{
          background: 'linear-gradient(135deg, #030349 0%, #0f1740 50%, #16213e 100%)',
          borderRadius: '16px',
          boxShadow: '0 0 25px rgba(0, 200, 255, 0.15)',
          transition: 'all 0.4s ease-in-out'
        }}
      >
        <div
          className="futuristic-line-container"
          style={{
            height: `${Math.max(250, dailyWorkHours.length * 10)}px`, // dynamic height
            width: '100%',
            padding: '10px'
          }}
        >
          {dailyWorkHours.length > 0 ? (
            <Line data={lineData} options={lineOptions} />
          ) : (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="text-center futuristic-text">
                <FaChartLine
                  size={56}
                  className="mb-3 futuristic-icon opacity-75"
                />
                <h5 className="text-white">Awaiting Data Stream</h5>
                <p className="opacity-75 text-white-50">
                  Performance metrics will appear here
                </p>
              </div>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  </div>

  {/* Table Section */}
  <div className="col-12 col-lg-4 mb-4">
    <Card className="shadow-sm border-0 h-100 futuristic-table-card">
      <Card.Header
        className="border-0 d-flex align-items-center justify-content-center"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
          borderRadius: '16px 16px 0 0',
          color: '#fff',
          fontWeight: '600'
        }}
      >
        <FaUsers className="me-2" />
        <h5 className="mb-0">Daily Work Hours</h5>
      </Card.Header>
      <Card.Body className="p-0">
        {dailyWorkHours.length > 0 ? (
          <div className="table-responsive" style={{ maxHeight: '450px' }}>
            <Table className="table-dark table-hover mb-0 align-middle">
              <thead
                className="sticky-top"
                style={{
                  background: 'linear-gradient(135deg, #222831, #393e46)'
                }}
              >
                <tr>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Avg</th>
                  {/* <th>Status</th> */}
                </tr>
              </thead>
              <tbody>
                {dailyWorkHours.map((d, i) => {
                  const status = getWorkHoursStatus(d.totalWorkingHours || 0);
                  return (
                    <tr key={i}>
                      <td>
                        {(() => {
                          try {
                            return new Date(d.date).toLocaleDateString();
                          } catch {
                            return 'Invalid Date';
                          }
                        })()}
                      </td>
                      <td>{(d.totalWorkingHours || 0).toFixed(1)}h</td>
                      <td>{(d.averageWorkHours || 0).toFixed(1)}h</td>
                      <td>
                        {/* <Badge bg={status.variant}>{status.text}</Badge> */}
                      </td>
                    </tr>
                  );
                })}
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
</div>


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
    </div>
  );
};

export default Dashboard;