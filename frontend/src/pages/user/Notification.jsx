import React from "react";
import "./Notification.css";

export default function Notification({ notifications }) {
  const hasNotifications = notifications && notifications.length > 0;

  return (
    <div className="notification-container">
      <div className="notification-header">
        <h2>Notification</h2>
        <button className="mark-read">Mark All as Read</button>
      </div>

      <div className="notification-content">
        {hasNotifications ? (
          <ul className="notification-list">
            {notifications.map((notif, index) => (
              <li
                key={index}
                className={`notification-item ${
                  notif.highlight ? "highlight" : ""
                }`}
              >
                <h4>{notif.title}</h4>
                <p>{notif.message}</p>
                <span className="time">{notif.time}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="no-notifications">
            <img src="/no-notif.png" alt="No Notifications" />
            <h3>No Notifications Yet</h3>
            <p>
              You have no notifications at the moment. We’ll let you know when
              something important comes up.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
