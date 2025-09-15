import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../style/Header.css";
import { FaBars } from "react-icons/fa";
import logoImage from "../assets/logo-blasterc-blue.png";
import Notification from "./Notification-dropdown";
import { fetchApi, getProfile } from "../utils/api";
import Profile from "../pages/user/Profile";

const Header = ({ toggleSidebar }) => {
  const { logout, user: authUser } = useAuth();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0); // State untuk jumlah notifikasi belum dibaca
  const [loading, setLoading] = useState(false);

  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [imageError, setImageError] = useState(false);

  // Refs untuk handle click outside
  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const toggleNotificationDropdown = () => {
    setShowNotifications((prev) => !prev);
    setShowProfile(false);
  };

  const toggleProfileDropdown = () => {
    setShowProfile((prev) => !prev);
    setShowNotifications(false);
  };

  const refreshNotifications = () => {
    setLoading(true);
    let endpoint = "/notifications";

    if (authUser?.role === "admin") {
      endpoint = "/notifications/admin";
    }

    fetchApi(endpoint)
      .then((data) => {
        setNotifications(data);
        // Hitung jumlah notifikasi yang belum dibaca
        const unread = data.filter(notif => !notif.is_read).length;
        setUnreadCount(unread);
      })
      .catch((err) => console.error("Error refresh notifications:", err))
      .finally(() => setLoading(false));
  };

  // Dalam Header.js
const fetchUnreadCount = () => {
  fetchApi('/notifications/unread-count')
    .then(data => setUnreadCount(data.count))
    .catch(err => console.error('Error fetching unread count:', err));
};

// Gunakan fungsi ini untuk polling yang lebih ringan
useEffect(() => {
  const intervalId = setInterval(() => {
    fetchUnreadCount();
  }, 30000);
  
  return () => clearInterval(intervalId);
}, []);

  // Handle click outside untuk menutup dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Ambil profil user saat Header mount
  useEffect(() => {
    getProfile()
      .then((res) => {
        if (res.success) {
          setProfileData(res.data);
        }
      })
      .catch((err) => console.error("Gagal ambil profil:", err));
  }, []);

  useEffect(() => {
    if (showNotifications) {
      refreshNotifications();
    } else {
      // Refresh notifikasi secara berkala meski dropdown tidak terbuka
      refreshNotifications();
      
      // Set interval untuk polling notifikasi setiap 30 detik
      const intervalId = setInterval(() => {
        refreshNotifications();
      }, 30000);
      
      return () => clearInterval(intervalId);
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
        {/* Notifikasi */}
        <div className="notification-wrapper" ref={notificationRef}>
          <button
            className="notification-icon"
            onClick={toggleNotificationDropdown}
          >
            🔔
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
          {showNotifications && (
            <div className="notification-dropdown">
              <Notification
                notifications={notifications}
                loading={loading}
                refreshNotifications={refreshNotifications}
                onClose={() => setShowNotifications(false)}
              />
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="profile-dropdown" ref={profileRef}>
          <div className="profile-pic-container" onClick={toggleProfileDropdown}>
            {profileData?.profile_image && !imageError ? (
              <img
                src={`http://localhost:5000${profileData.profile_image}`}
                alt="Profile"
                className="profile-pic"
                onError={(e) => {
                  console.error('Failed to load profile image:', e.target.src);
                  setImageError(true);
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="profile-fallback">
                {profileData?.name ? profileData.name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
          </div>
          
          {/* ✅ Dropdown content */}
          {showProfile && (
            <div className="profile-dropdown-content">
              <Profile 
                logout={handleLogout} 
                onMenuClick={() => setShowProfile(false)}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;