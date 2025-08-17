import React from "react";
import "./TopUpCredit.css";

export default function TopUpCredit() {
  return (
    <div className="topup-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">BLASTERC</div>
        <nav>
          <a href="#" className="menu-item">Dashboard</a>
          <a href="#" className="menu-item">Campaign</a>
          <a href="#" className="menu-item active">Deposit</a>
          <a href="#" className="menu-item">Referral</a>
          <a href="#" className="menu-item">Contact Support</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="content">
        <div className="breadcrumb">
          <span>Deposit</span> &gt; <span>Top Up Credit</span>
        </div>

        <h2 className="title">Top Up Credit</h2>

        {/* Steps */}
        <div className="steps">
          <div className="step active">1<br />Top Up Deposit</div>
          <div className="step active">2<br />Check Payment</div>
          <div className="step">3<br />Payment Instruction</div>
        </div>

        {/* Transaction Box */}
        <div className="transaction-box">
          <h3>Check Transaction</h3>

          <div className="transaction-item">
            <span>Recipient Wallet Address</span>
            <span className="wallet">TQ7XJ...Fh9pGp</span>
          </div>

          <div className="transaction-item">
            <span>Your Wallet Address</span>
            <span className="wallet">TPAgK...feuer5</span>
          </div>

          <div className="transaction-item">
            <span>Top Up</span>
            <span className="amount">$500</span>
          </div>

          <div className="transaction-item">
            <span>Convert to Credit</span>
            <span className="credit">50.000</span>
          </div>

          <div className="buttons">
            <button className="btn-back">Back</button>
            <button className="btn-proceed">Proceed</button>
          </div>
        </div>
      </main>
    </div>
  );
}
