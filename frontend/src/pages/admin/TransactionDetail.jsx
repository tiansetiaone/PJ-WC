import React from "react";
import "./TransactionDetail.css";

export default function TransactionDetail() {
  return (
    <div className="transaction-container">
      <div className="transaction-card">
        <h3 className="transaction-title">Transaction</h3>

        {/* Status */}
        <div className="status-badge checking">Checking Deposit</div>

        {/* Payment Info */}
        <div className="section">
          <h4>Payment</h4>
          <div className="info-row">
            <span>ID Deposit</span>
            <strong>M4pX****************9TqJ</strong>
          </div>
          <div className="info-row">
            <span>Payment Date</span>
            <strong>24 June 2025 12:00</strong>
          </div>
          <div className="info-row">
            <span>Recipient Wallet Address</span>
            <strong>
              TQ7xJ...Fh9pGp <button className="icon-btn">👁</button>
            </strong>
          </div>
          <div className="info-row">
            <span>User’s Wallet Address</span>
            <strong>
              TPA9k...feuer5 <button className="icon-btn">👁</button>
            </strong>
          </div>
          <div className="info-row">
            <span>Transfer Evidence</span>
            <a href="#">proof-of-transfer.png ⬇</a>
          </div>
          <div className="info-row">
            <span>Etherscan Transaction Link</span>
            <a href="#">
              https://eth...d3e4 ↗
            </a>
          </div>
        </div>

        {/* Top Up & Credit */}
        <div className="section">
          <div className="info-row highlight">
            <span>Top Up</span>
            <strong>$10.509</strong>
          </div>
          <div className="info-row highlight credit">
            <span>Convert to Credit</span>
            <strong>1.050.900</strong>
          </div>
        </div>

        {/* User Request */}
        <div className="section">
          <h4>User’s Request</h4>
          <div className="info-row">
            <span>Full Name</span>
            <strong>Tio Ramdan</strong>
          </div>
          <div className="info-row">
            <span>Username</span>
            <strong>@tioramdan</strong>
          </div>
        </div>

        {/* Buttons */}
        <div className="action-buttons">
          <button className="btn secondary">Back</button>
          <button className="btn danger">Reject</button>
          <button className="btn primary">Approve</button>
        </div>
      </div>
    </div>
  );
}
