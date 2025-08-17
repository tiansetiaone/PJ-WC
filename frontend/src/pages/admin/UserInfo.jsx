import React from "react";
import "./UserInfo.css";

const UserInfo = () => {
  return (
    <div className="user-info-container">
      <div className="user-info-card">
        <h2 className="section-title">User Info</h2>

        <div className="user-data">
          <h3 className="sub-title">User Data</h3>
          <div className="data-grid">
            <div className="data-label">Full Name</div>
            <div className="data-value">Tio Ramdan</div>

            <div className="data-label">Username</div>
            <div className="data-value">@tioramdan</div>

            <div className="data-label">WhatsApp Number</div>
            <div className="data-value">+62 801-2345-6789</div>

            <div className="data-label">User’s Wallet Address</div>
            <div className="data-value">
              TPA9k...feuer5 <span className="eye-icon">👁</span>
            </div>

            <div className="data-label">Email</div>
            <div className="data-value">tioramdan@gmail.com</div>

            <div className="data-label">Register Channel</div>
            <div className="data-value">Google</div>

            <div className="data-label">Register Date</div>
            <div className="data-value">24 June 2025</div>

            <div className="data-label">Status</div>
            <div className="data-value">
              <span className="status-checking">🔍 Checking Register</span>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button className="btn back">Back</button>
          <button className="btn block">Block User</button>
          <button className="btn reset">Reset Password</button>
          <button className="btn approve">Approve</button>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
