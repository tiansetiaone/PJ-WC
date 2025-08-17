import React from "react";
import "../styles/NotificationInfo.css";

const NotificationInfo = () => {
  return (
    <div className="notification-info-container">
      <div className="notification-card">
        <h2 className="title">Notification Info</h2>

        <div className="section">
          <h3 className="subtitle">Notification</h3>
          <div className="row">
            <span className="label">Notification Title</span>
            <span className="value">BLACK FRIDAY!</span>
          </div>
          <div className="row">
            <span className="label">Publish Date</span>
            <span className="value">24 June 2025</span>
          </div>
        </div>

        <div className="section">
          <h3 className="subtitle">Notification Message</h3>
          <p className="message">
            🎉 We’re excited to announce that Dark Mode is now available on both
            web and mobile platforms! You can easily switch themes from your
            settings and enjoy a more comfortable viewing experience, day or
            night. Try it now and let us know what you think.
          </p>
        </div>

        <div className="actions">
          <button className="btn-back">Back</button>
        </div>
      </div>
    </div>
  );
};

export default NotificationInfo;
