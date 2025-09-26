import React from 'react';
import { 
  FaTachometerAlt, 
  FaCar,
  FaExclamationTriangle  
  // FaRoute, 
  // FaBatteryHalf, 
  // FaMapMarkerAlt, 
  // FaCog,
  
} from 'react-icons/fa';

const Sidebar = ({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) => {
  const menuItems = [
    { id: 'Trip Details', name: 'Trip Details', icon: <FaTachometerAlt /> },
    { id: 'Vehicle History', name: 'Vehicle History', icon: <FaCar /> },
    { id: 'Theftdetection', name: 'Theftdetection', icon: <FaExclamationTriangle  /> }, 
   
  ];

  const handleMenuItemClick = (tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h2>EV Dashboard</h2>
        <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>
        </button>
        <div className="connection-status">
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button 
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => handleMenuItemClick(item.id)}
          >
            {item.icon}
            <span>{item.name}</span>
          </button>
        ))}
      </nav>
      
      
    </div>
  );
};

export default Sidebar;