import React, { useState } from 'react';
import Sidebar from './Component/Sidebar';
import Header from './Component/Header';
import VehicleInfo from './Component/VehicleInfo';
import Theftdetection from './Component/TripsFare';
import Dashboard from './Component/Dashboard';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'Vehicle History':
        return <VehicleInfo />;
      case 'Theftdetection':
        return <Theftdetection />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Header 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        activeTab={activeTab}
      />
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="main-content">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;