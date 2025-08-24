import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../style/Header.css";
import { FaBars } from "react-icons/fa";
import logoImage from "../assets/logo-blasterc-blue.png";
import Notification from "./Notification-dropdown";
import { fetchApi } from "../utils/api";

const Header = ({ toggleSidebar }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const toggleNotificationDropdown = () => {
    setShowNotifications((prev) => !prev);
  };

  // Fungsi untuk refresh notifikasi (bisa dipanggil child)
  const refreshNotifications = () => {
    setLoading(true);
    fetchApi("/notifications/admin")
      .then((data) => {
        setNotifications(data);
      })
      .catch((err) => console.error("Error refresh notifications:", err))
      .finally(() => setLoading(false));
  };

  // Fetch notifikasi pertama kali ketika dropdown dibuka
  useEffect(() => {
    if (showNotifications) {
      refreshNotifications();
    }
  }, [showNotifications]);

  return (
    <header className="topnav">
      <div className="left">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <FaBars />
        </button>
        <img src={logoImage} alt="BLASTERC" className="logo-img" />
      </div>
      <div className="right">
        <div className="notification-wrapper">
          <button
            className="notification-icon"
            onClick={toggleNotificationDropdown}
          >
            🔔
          </button>
          {showNotifications && (
            <div className="notification-dropdown">
              <Notification
                notifications={notifications}
                loading={loading}
                refreshNotifications={refreshNotifications}
              />
            </div>
          )}
        </div>

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
