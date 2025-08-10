import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../style/Header.css';
import { FaBars } from 'react-icons/fa';
import logoImage from "../assets/logo-blasterc-blue.png";

const Header = ({ toggleSidebar }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="topnav">
      <div className="left">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <FaBars />
        </button>
          <img src={logoImage} alt="BLASTERC" className="logo-img" />
      </div>
      <div className="right">
        <button className="notification-icon">🔔</button>
        <div className="profile-dropdown">
          <img src="/profile.jpg" alt="Profile" className="profile-pic" />
          <div className="dropdown-content">
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;