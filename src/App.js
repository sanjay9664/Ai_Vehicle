import React, { useState, useEffect } from 'react';
import Sidebar from './Component/Sidebar';
import RiderDetails from './Component/RiderDetails';
import VehicleInfo from './Component/VehicleInfo';
import Theftdetection from './Component/TripsFare';
import Individual_Dashboard from './Component/Individual_Dashboard';
import Dashboard from './Component/Dashboard';
import Aggregated from './Component/Aggregated';
import './App.css';

function App() {
  // 🔹 Step 1: load last active tab from localStorage (default = 'dashboard')
  const [activeTab, setActiveTab] = useState(
    localStorage.getItem('activeTab') || 'dashboard'
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 🔹 Step 2: whenever activeTab changes, save to localStorage
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'Vehicle History':
        return <VehicleInfo />;
      case 'Theftdetection':
        return <Theftdetection />;
      case 'RiderDetails':
        return <RiderDetails />;
      case 'Individual_Dashboard':
        return <Individual_Dashboard />;
      case 'Aggregated':
        return <Aggregated />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="main-content">{renderContent()}</div>
    </div>
  );
}

export default App;
