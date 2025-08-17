import React, { useState } from "react";
import "./TopUpCredit.css";

const TopUpCredit = () => {
  const [selected, setSelected] = useState(null);
  const [customAmount, setCustomAmount] = useState("");

  const amounts = [
    { value: 100, credits: "10.000 credits" },
    { value: 200, credits: "20.000 credits" },
    { value: 500, credits: "50.000 credits", best: true },
    { value: 1000, credits: "1.000.000 credits" },
    { value: 2000, credits: "10.000 credits" },
    { value: 3000, credits: "20.000 credits" },
    { value: 5000, credits: "50.000 credits" },
    { value: 10000, credits: "1.000.000 credits" },
  ];

  return (
    <div className="topup-container">
      <div className="breadcrumb">Deposit &gt; Top Up Credit</div>
      <h1 className="title">Top Up Credit</h1>

      {/* Step Indicator */}
      <div className="steps">
        <div className="step active">1 <span>Top Up Deposit</span></div>
        <div className="step">2 <span>Check Payment</span></div>
        <div className="step">3 <span>Payment Instruction</span></div>
      </div>

      {/* Nominal Section */}
      <div className="nominal-section">
        <h3>Choose Nominal</h3>
        <div className="nominal-grid">
          {amounts.map((item, index) => (
            <div
              key={index}
              className={`nominal-card ${selected === index ? "selected" : ""}`}
              onClick={() => {
                setSelected(index);
                setCustomAmount("");
              }}
            >
              {item.best && <div className="best-badge">BEST</div>}
              <div className="amount">${item.value}</div>
              <div className="credits">Get {item.credits}</div>
            </div>
          ))}
        </div>

        <div className="custom-input">
          <label>Input Another Nominal</label>
          <input
            type="number"
            placeholder="More than $20,000..."
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelected(null);
            }}
          />
        </div>

        <p className="info-text">ⓘ Every $1 will get 100 credits</p>
        <button
          className="confirm-btn"
          disabled={!selected && !customAmount}
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

export default TopUpCredit;
