import React from 'react';
import { FaBars } from 'react-icons/fa';

const Header = ({ sidebarOpen, setSidebarOpen, activeTab }) => {
  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Vehicle Dashboard';
      case 'vehicle-info': return 'Vehicle Information';
      case 'trips-fare': return 'Trips and Fare';
      default: return 'EV Dashboard';
    }
  };

  return (
    <div className="mobile-header">
      <button 
        className="menu-toggle-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <FaBars />
      </button>
      <h2>{getTitle()}</h2>
      <div className="status-indicator online"></div>
    </div>
  );
};

export default Header;