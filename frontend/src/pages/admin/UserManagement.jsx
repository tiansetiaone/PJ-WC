import React from "react";
import "./UserManagement.css";
import { FaUsers, FaBullhorn, FaWallet, FaShareAlt, FaBell, FaHeadset } from "react-icons/fa";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h2 className="logo">BLASTERC</h2>
      <ul>
        <li><FaUsers className="icon" /> Dashboard</li>
        <li className="active"><FaUsers className="icon" /> User Management</li>
        <li><FaBullhorn className="icon" /> Campaign Management</li>
        <li><FaWallet className="icon" /> Deposit Management</li>
        <li><FaShareAlt className="icon" /> Referral Settings</li>
        <li><FaBell className="icon" /> Notification Management</li>
        <li><FaHeadset className="icon" /> Ticket Support</li>
      </ul>
    </div>
  );
};

const UserManagement = () => {
  return (
    <div className="container">
      <Sidebar />
      <div className="main-content">
        <div className="header">
          <span>User Management</span>
          <div className="profile">
            <span className="notif">🔔</span>
            <div className="avatar">AD</div>
          </div>
        </div>

        <div className="breadcrumb">› User Management</div>

        <div className="card">
          <h3>Registered Users</h3>
          <div className="empty-state">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4076/4076505.png"
              alt="empty"
            />
            <h4>No Registered Users Yet</h4>
            <p>
              There are no users registered to the system at this time. Once
              users are added, they will appear here for you to manage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
