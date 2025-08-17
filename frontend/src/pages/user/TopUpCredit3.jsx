import React from "react";
import "./TopUpCredit.css";

export default function TopUpCredit() {
  return (
    <div className="topup-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Deposit</span> &gt; <span className="active">Top Up Credit</span>
      </div>

      {/* Title */}
      <h2 className="page-title">Top Up Credit</h2>

      {/* Step Indicator */}
      <div className="steps">
        <div className="step active">1<br />Top Up Deposit</div>
        <div className="step">2<br />Check Payment</div>
        <div className="step">3<br />Payment Instruction</div>
      </div>

      {/* Payment Instruction */}
      <div className="payment-box">
        <h3>Payment Instruction</h3>
        <div className="wallet-info">
          <img
            src="https://cryptologos.cc/logos/tether-usdt-logo.png"
            alt="USDT"
            className="wallet-icon"
          />
          <div>
            <p>Recipient Wallet Address (USDT TRC20)</p>
            <a href="#">TQ7xJ...Fh9gGp</a>
          </div>
        </div>

        {/* Payment Details */}
        <div className="payment-details">
          <div><strong>ID Deposit</strong> <span>M4pX************9TqJ</span></div>
          <div><strong>Countdown</strong> <span className="countdown">01:41:56</span></div>
          <div><strong>Payment Date</strong> <span>24 June 2025 12:00</span></div>
          <div><strong>Your Wallet Address</strong> <span>TPAgK...fueer5</span></div>
          <div><strong>Top Up</strong> <span className="amount">$500</span></div>
          <div><strong>Convert to Credit</strong> <span className="credit">50.000</span></div>
        </div>

        {/* Buttons */}
        <div className="btn-group">
          <button className="btn-back">Back</button>
          <button className="btn-done">Payment Done</button>
        </div>
      </div>

      {/* Info Section */}
      <div className="info-box">
        <h3>Top Up Information</h3>
        <ol>
          <li>Choose TRC20 Network, make sure your wallet/exchange supports USDT-TRC20 (Tron blockchain).</li>
          <li>Complete your transfer before the countdown ends.</li>
        </ol>
      </div>
    </div>
  );
}
