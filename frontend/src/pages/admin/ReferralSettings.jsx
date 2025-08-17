import React from "react";
import "./ReferralSettings.css";

export default function ReferralSettings() {
  return (
    <div className="referral-container">
      {/* Header */}
      <div className="referral-header">
        <h2>Referral Settings</h2>
        <button className="btn-primary">+ Create New Rate</button>
      </div>

      {/* Settings History */}
      <div className="referral-card">
        <h3 className="card-title">Settings History</h3>
        <div className="empty-state">
          <img
            src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
            alt="empty"
          />
          <p className="empty-title">No Settings History Yet</p>
          <p className="empty-subtitle">
            There is no referral commission rate setting recorded yet. Once you
            configure the referral settings, the history will appear here.
          </p>
        </div>
      </div>

      {/* Referral Registered History */}
      <div className="referral-card">
        <h3 className="card-title">Referral Registered History</h3>
        <div className="empty-state">
          <img
            src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
            alt="empty"
          />
          <p className="empty-title">No Referral Registered History Yet</p>
          <p className="empty-subtitle">
            No users have registered through any referral link yet. When a user
            signs up via a referral, the details will be displayed here.
          </p>
        </div>
      </div>
    </div>
  );
}
