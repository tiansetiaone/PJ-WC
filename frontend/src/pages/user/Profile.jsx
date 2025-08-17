import React, { useState } from "react";


export default function Profile() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <div className="profile-container">
      {/* Profile Card */}
      <div className="profile-card">
        <h2 className="profile-title">Profile</h2>
        <div className="profile-info">
          <img
            src="https://via.placeholder.com/40"
            alt="Profile"
            className="profile-avatar"
          />
          <div>
            <p className="profile-name">Tio Ramdan</p>
            <p className="profile-email">tioramdan@gmail.com</p>
          </div>
        </div>

        <div className="profile-action" onClick={() => alert("Edit Profile")}>
          <span className="profile-icon">👤</span>
          <span>Edit Profile</span>
        </div>

        <div
          className="logout-button"
          onClick={() => setShowLogoutModal(true)}
        >
          <span className="logout-icon">↪</span>
          <span>Log Out</span>
        </div>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal">
            <p className="modal-title">Are you sure want to log out?</p>
            <p className="modal-text">
              You will be logged out of your account and may need to log in
              again to continue using the services.
            </p>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button className="btn-confirm" onClick={() => alert("Logged Out")}>
                Yes, Sure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
