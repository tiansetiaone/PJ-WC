import React, { useState } from "react";
import "./NewRate.css";

export default function NewRate() {
  const [rate, setRate] = useState("");
  const [lastRate] = useState(0.5);

  const handleChange = (e) => {
    setRate(e.target.value);
  };

  const handleSave = () => {
    if (rate && rate < 5) {
      alert(`New Rate Saved: $${rate}`);
    } else {
      alert("Rate must be less than $5");
    }
  };

  return (
    <div className="newrate-container">
      <h2 className="newrate-title">New Rate</h2>

      <div className="last-rate-box">
        <p className="last-rate-label">Last Rate</p>
        <p className="last-rate-value">${lastRate}</p>
      </div>

      <div className="input-group">
        <label className="input-label">
          * New Rate
        </label>
        <div className="input-wrapper">
          <span className="currency-symbol">$</span>
          <input
            type="number"
            placeholder="e.g 1"
            value={rate}
            onChange={handleChange}
          />
        </div>
        <small className="input-hint">Input rate less than $5</small>
      </div>

      <div className="button-group">
        <button className="btn-back">Back</button>
        <button 
          className="btn-save" 
          disabled={!rate || rate >= 5}
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </div>
  );
}
