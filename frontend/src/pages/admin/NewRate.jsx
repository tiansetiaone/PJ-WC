import React, { useState } from "react";
import "../../style/admin/NewRate.css";
import { createReferralRole } from "../../utils/api";

export default function NewRate({ onClose }) {
  const [rate, setRate] = useState("");
  const [lastRate] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("percent");
  const [level, setLevel] = useState(1);

  const handleChange = (e) => setRate(e.target.value);

  const handleSave = async () => {
    // Validasi untuk tipe percent (0-100%) dan flat (kurang dari $5)
    if (type === "percent") {
      if (!rate || parseFloat(rate) > 100 || parseFloat(rate) <= 0) {
        alert("Percent rate must be between 0.01% and 100%");
        return;
      }
    } else {
      if (!rate || parseFloat(rate) >= 5 || parseFloat(rate) <= 0) {
        alert("Flat rate must be between $0.01 and $4.99");
        return;
      }
    }

    try {
      setLoading(true);

      const data = {
        role_name: `referral_rate_${Date.now()}`,
        commission_type: type,
        commission_rate: parseFloat(rate),
        min_conversion: 10,
        level
      };

      const res = await createReferralRole(data);

      alert(res.message || "New referral rate created successfully");
      onClose(); // Tutup modal dan trigger refresh
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
        <label className="input-label">* Commission Type</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="percent">Percent</option>
          <option value="flat">Flat</option>
        </select>
      </div>

      <div className="input-group">
        <label className="input-label">* New Rate</label>
        <div className="input-wrapper">
          {type === "flat" && <span className="currency-symbol">$</span>}
          <input
            type="number"
            placeholder={type === "percent" ? "e.g 5" : "e.g 1"}
            value={rate}
            onChange={handleChange}
            min="0.01"
            max={type === "percent" ? "100" : "4.99"}
            step="0.01"
          />
          {type === "percent" && <span className="currency-symbol">%</span>}
        </div>
        <small className="input-hint">
          {type === "percent" 
            ? "Input rate between 0.01% and 100%" 
            : "Input rate between $0.01 and $4.99"}
        </small>
      </div>

      <div className="input-group">
        <label className="input-label">* Level</label>
        <input
          type="number"
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          min="1"
        />
      </div>

      <div className="button-group">
        <button className="btn-back" onClick={onClose} disabled={loading}>
          Back
        </button>
        <button
          className="btn-save-newrate"
          disabled={!rate || loading}
          onClick={handleSave}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}