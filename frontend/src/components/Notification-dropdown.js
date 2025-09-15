import React from "react";
import { fetchApi } from "../utils/api";
import "../style/Notification-dropdown.css";

const Notification = ({ notifications, loading, refreshNotifications, onClose }) => {
  const handleMarkAllRead = async () => {
    try {
      await fetchApi("/notifications/read-all", {
        method: "PATCH",
      });

      refreshNotifications(); // panggil ulang fetch dari Header.js biar update
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await fetchApi(`/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
      
      refreshNotifications(); // Refresh untuk update badge count
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  if (loading) {
    return (
      <div className="notification-container">
        <div className="notification-header">
          <h2>Notification</h2>
          {/* <button className="close-btn" onClick={onClose}>×</button> */}
        </div>
        <p style={{ padding: "12px", color: "#777" }}>Loading...</p>
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="notification-container">
        <div className="notification-header">
          <h2>Notification</h2>
          {/* <button className="close-btn" onClick={onClose}>×</button> */}
        </div>
        <p style={{ padding: "12px", color: "#777" }}>No notifications</p>
      </div>
    );
  }

  return (
    <div className="notification-container">
      <div className="notification-header">
        <h2>Notification</h2>
        <div>
          <button className="mark-read-btn" onClick={handleMarkAllRead}>
            Mark All as Read
          </button>
          {/* <button className="close-btn" onClick={onClose}>×</button> */}
        </div>
      </div>

      <div className="notification-list">
        {notifications.map((notif) => (
          <div 
            key={notif.id} 
            className={`notification-item ${notif.is_read ? "" : "highlight"}`}
            onClick={() => handleMarkAsRead(notif.id)}
            style={{ cursor: 'pointer' }}
          >
            <h3 className="notification-title">{notif.title}</h3>
            <p className="notification-message">{notif.content}</p>
            <span className="notification-time">{new Date(notif.created_at).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notification;