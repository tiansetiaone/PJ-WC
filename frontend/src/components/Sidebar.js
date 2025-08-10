import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import '../style/Sidebar.css';

const Sidebar = ({ isOpen, onClose, isCollapsed }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.sidebar')) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (isOpen && event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, isMobile]);

return (
  <>
    {isMobile && isOpen && (
      <div className="sidebar-overlay active" onClick={onClose} />
    )}
    
    <nav className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        <ul className="menu">
          <li>
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={isMobile ? onClose : null}
            >
              <span className="icon">🏠</span>
              {!isCollapsed && 'Dashboard'}
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/campaign" 
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={isMobile ? onClose : null}
            >
              <span className="icon">📢</span>
              {!isCollapsed && 'Campaign'}
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/deposit" 
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={isMobile ? onClose : null}
            >
              <span className="icon">💳</span>
              {!isCollapsed && 'Deposit'}
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/referral" 
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={isMobile ? onClose : null}
            >
              <span className="icon">👤</span>
              {!isCollapsed && 'Referral'}
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/support" 
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={isMobile ? onClose : null}
            >
              <span className="icon">🎧</span>
              {!isCollapsed && 'Contact Support'}
            </NavLink>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default Sidebar;