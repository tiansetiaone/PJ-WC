import React from "react";
import "../../style/admin/NotificationInfo.css";

const NotificationInfo = ({ notification, onClose }) => {
  if (!notification) return null;

  // Format tanggal hanya "DD Month YYYY"
  const formatDate = (dateString) => {
    const options = { day: "numeric", month: "long", year: "numeric" };
    return new Date(dateString).toLocaleDateString("en-GB", options);
  };

  return (
    <div className="notification-info-container">
      <div className="notification-card">
        <h2 className="title">Notification Info</h2>

        <div className="section">
          <h5 className="subtitle">Notification</h5>
          <div className="row">
            <span className="label">Notification Title</span>
            <span className="value">{notification.title}</span>
          </div>
          <div className="row">
            <span className="label">Publish Date</span>
            <span className="value">{formatDate(notification.created_at)}</span>
          </div>
        </div>

        <div className="section">
          <h5 className="subtitle">Notification Message</h5>
          <p className="message">{notification.content}</p>
        </div>

        <div className="actions">
          <button className="btn-back" onClick={onClose}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationInfo;
