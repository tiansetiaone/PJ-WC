import React from "react";
import "./NotificationManagement.css";

const NotificationManagement = () => {
  return (
    <div className="notification-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">BLASTERC</div>
        <nav>
          <ul>
            <li>Dashboard</li>
            <li>User Management</li>
            <li>Campaign Management</li>
            <li>Deposit Management</li>
            <li>Referral Settings</li>
            <li className="active">Notification Management</li>
            <li>Ticket Support</li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <div className="header">
          <div className="breadcrumb">
            <span>Notification Management</span>
          </div>
          <button className="create-btn">+ Create New Notification</button>
        </div>

        {/* Notification Section */}
        <div className="notification-box">
          <h2>Notification History</h2>
          <div className="empty-state">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
              alt="empty"
            />
            <h3>No Notification History Yet</h3>
            <p>
              There are no notifications recorded yet. Once you create and send
              a new update, it will appear here for users to view.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotificationManagement;
