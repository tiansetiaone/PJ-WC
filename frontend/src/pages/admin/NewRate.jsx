import React, { useState } from "react";
import "../../style/admin/NewRate.css";
import { createReferralRole } from "../../utils/api";

export default function NewRate({ onClose }) {
  const [rate, setRate] = useState("");
  const [lastRate] = useState(0.5);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setRate(e.target.value);

  const handleSave = async () => {
    if (!rate || rate >= 5) {
      alert("Rate must be less than $5");
      return;
    }

    try {
      setLoading(true);

      const data = {
        role_name: `referral_rate_${Date.now()}`, // nama unik
        commission_rate: parseFloat(rate),
        min_conversion: 10, // default min conversion
      };

      const res = await createReferralRole(data);

      alert(res.message || "New referral rate created successfully");
      onClose(); // tutup modal
    } catch (err) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setLoading(false);
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
        <label className="input-label">* New Rate</label>
        <div className="input-wrapper">
          <span className="currency-symbol">$</span>
          <input
            type="number"
            placeholder="e.g 1"
            value={rate}
            onChange={handleChange}
            min="0"
            max="5"
            step="0.01"
          />
        </div>
        <small className="input-hint">Input rate less than $5</small>
      </div>

      <div className="button-group">
        <button className="btn-back" onClick={onClose} disabled={loading}>
          Back
        </button>
        <button
          className="btn-save"
          disabled={!rate || rate >= 5 || loading}
          onClick={handleSave}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
