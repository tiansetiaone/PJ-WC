import React from "react";
import { fetchApi } from "../utils/api";
import "../style/Notification-dropdown.css";

const Notification = ({ notifications, loading, refreshNotifications }) => {
  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.is_read);

      await Promise.all(
        unread.map((notif) =>
          fetchApi(`/notifications/${notif.id}/read`, {
            method: "PATCH",
          })
        )
      );

      refreshNotifications(); // panggil ulang fetch dari Header.js biar update
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  if (loading) {
    return (
      <div className="notification-container">
        <div className="notification-header">
          <h2>Notification</h2>
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
        </div>
        <p style={{ padding: "12px", color: "#777" }}>No notifications</p>
      </div>
    );
  }

  return (
    <div className="notification-container">
      <div className="notification-header">
        <h2>Notification</h2>
        <button className="mark-read-btn" onClick={handleMarkAllRead}>
          Mark All as Read
        </button>
      </div>

      <div className="notification-list">
        {notifications.map((notif) => (
          <div key={notif.id} className={`notification-item ${notif.is_read ? "" : "highlight"}`}>
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
