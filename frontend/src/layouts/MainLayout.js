import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import '../style/MainLayout.css';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleClose = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="main-layout">
      <Sidebar 
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={handleClose}
      />
      
      <div className={`main-content ${!sidebarCollapsed ? 'expanded' : ''}`}>
        <Header toggleSidebar={toggleSidebar} />
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;