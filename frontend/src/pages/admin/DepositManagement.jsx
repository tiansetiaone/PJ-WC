import React from "react";
import "./DepositManagement.css";

export default function DepositManagement() {
  return (
    <div className="deposit-container">
      <h2 className="deposit-title">Deposit Management</h2>

      {/* Deposit Requests */}
      <div className="deposit-card">
        <h3 className="card-title">Deposit Requests</h3>
        <div className="card-content">
          <img
            src="https://via.placeholder.com/120x120.png?text=No+Data"
            alt="No Deposit"
            className="card-image"
          />
          <h4 className="empty-title">No Deposit Requests Yet</h4>
          <p className="empty-text">
            There are no deposit requests at the moment. Any new requests from
            users will appear here for your review.
          </p>
        </div>
      </div>

      {/* Converted Commission History */}
      <div className="deposit-card">
        <h3 className="card-title">Converted Commission History</h3>
        <div className="card-content">
          <img
            src="https://via.placeholder.com/120x120.png?text=No+Data"
            alt="No Commission"
            className="card-image"
          />
          <h4 className="empty-title">No Converted Commission History Yet</h4>
          <p className="empty-text">
            You haven't converted any commissions yet. Once you do, your history
            will appear here for easy tracking and review.
          </p>
        </div>
      </div>
    </div>
  );
}
