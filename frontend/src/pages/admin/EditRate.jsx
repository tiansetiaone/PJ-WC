import React, { useState, useEffect } from "react";
import "../../style/admin/EditRate.css";

export default function EditRate({ setting, onUpdate, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    commission_type: "percent",
    commission_value: "",
    min_deposit: "",
    is_active: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (setting) {
      setFormData({
        name: setting.name || "",
        commission_type: setting.commission_type || "percent",
        commission_value: setting.commission_value || "",
        min_deposit: setting.min_deposit || "",
        is_active: setting.is_active === 1
      });
    }
  }, [setting]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validasi
      if (!formData.name || !formData.commission_value || !formData.min_deposit) {
        throw new Error("All fields are required");
      }

      if (formData.commission_type === "percent" && 
          (formData.commission_value < 0 || formData.commission_value > 1)) {
        throw new Error("Percent commission must be between 0 and 1");
      }

      await onUpdate(setting.id, formData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-rate-container">
      <div className="edit-rate-header">
        <h2>Edit Commission Rate</h2>
        <button className="edit-close-btn" onClick={onClose}>×</button>
      </div>

      <form onSubmit={handleSubmit} className="edit-rate-form">
        {error && <div className="edit-error-message">{error}</div>}

        <div className="edit-form-group">
          <label>Setting Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Standard Rate"
            required
          />
        </div>

        <div className="edit-form-group">
          <label>Commission Type *</label>
          <select
            name="commission_type"
            value={formData.commission_type}
            onChange={handleChange}
            required
          >
            <option value="percent">Percentage (%)</option>
            <option value="flat">Flat Amount</option>
          </select>
        </div>

        <div className="edit-form-group">
          <label>
            {formData.commission_type === "percent" 
              ? "Commission Rate (%) *" 
              : "Commission Amount (USDT) *"}
          </label>
          <input
            type="number"
            name="commission_value"
            value={formData.commission_value}
            onChange={handleChange}
            step={formData.commission_type === "percent" ? "0.01" : "1"}
            min="0"
            max={formData.commission_type === "percent" ? "1" : undefined}
            placeholder={formData.commission_type === "percent" ? "0.10" : "10"}
            required
          />
          {formData.commission_type === "percent" && (
            <span className="edit-input-hint">
              Enter as decimal (0.10 = 10%)
            </span>
          )}
        </div>

        <div className="edit-form-group">
          <label>Minimum Deposit (USDT) *</label>
          <input
            type="number"
            name="min_deposit"
            value={formData.min_deposit}
            onChange={handleChange}
            step="1"
            min="0"
            placeholder="100"
            required
          />
        </div>

        <div className="edit-checkbox-group">
          <label>
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
            />
            Set as active commission setting
          </label>
          <span className="edit-checkbox-hint">
            {formData.is_active 
              ? "This will become the active setting" 
              : "This setting will be inactive"}
          </span>
        </div>

        <div className="edit-form-actions">
          <button 
            type="button" 
            className="edit-btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="edit-btn-save"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Commission Rate"}
          </button>
        </div>
      </form>
    </div>
  );
}