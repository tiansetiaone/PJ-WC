import React from "react";
import "./Transaction.css";

const Transaction = () => {
  return (
    <div className="transaction-container">
      <div className="transaction-card">
        <h2 className="transaction-title">Transaction</h2>

        <div className="transaction-status">
          <p>
            <i className="info-icon">ℹ</i> Your transaction currently under
            checking in our system, please wait a moments.
          </p>
        </div>

        <div className="transaction-section">
          <h3>Payment</h3>
          <div className="transaction-row">
            <span>ID Deposit</span>
            <span>M4pX****************9TqJ</span>
          </div>
          <div className="transaction-row">
            <span>Payment Date</span>
            <span>24 June 2025 12:00</span>
          </div>
          <div className="transaction-row">
            <span>Recipient Wallet Address</span>
            <span>TQ7xJ...Fh9pGp</span>
          </div>
          <div className="transaction-row">
            <span>Your Wallet Address</span>
            <span>TPAgK...feuer5</span>
          </div>
          <div className="transaction-row">
            <span>Transfer Evidence</span>
            <a href="#" className="link-download">
              proof-of-transfer.png
            </a>
          </div>
          <div className="transaction-row">
            <span>Etherscan Transaction Link</span>
            <a href="#" className="link-external">
              https://eth...n.io/tx/0x6f...d3e4
            </a>
          </div>
        </div>

        <div className="transaction-summary">
          <div className="summary-row">
            <span>Top Up</span>
            <span className="amount-usd">$10.509</span>
          </div>
          <div className="summary-row">
            <span>Convert to Credit</span>
            <span className="amount-credit">1.050.900</span>
          </div>
        </div>

        <button className="btn-back">Back</button>
      </div>
    </div>
  );
};

export default Transaction;
