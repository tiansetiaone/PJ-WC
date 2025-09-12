import React, { useState, useEffect } from "react";
import { fetchApi } from "../../utils/api";
import { X } from "lucide-react";
import "../../style/admin/CampaignPricingModal.css";

const CampaignPricingModal = ({ isOpen, onClose }) => {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    campaign_type: "whatsapp",
    price_per_number: "",
    min_numbers: "",
    max_numbers: "",
    status: "active"
  });

  useEffect(() => {
    if (isOpen) {
      loadPricing();
    }
  }, [isOpen]);

  const loadPricing = async () => {
    try {
      const response = await fetchApi("/campaigns/admin/pricing");
      if (response.success) {
        setPricing(response.data);
      }
    } catch (error) {
      console.error("Error loading pricing:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price_per_number: parseFloat(formData.price_per_number),
        min_numbers: parseInt(formData.min_numbers),
        max_numbers: formData.max_numbers ? parseInt(formData.max_numbers) : null
      };

      if (editingId) {
        await fetchApi(`/campaigns/admin/pricing/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        await fetchApi("/campaigns/admin/pricing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      setFormData({
        campaign_type: "whatsapp",
        price_per_number: "",
        min_numbers: "",
        max_numbers: "",
        status: "active"
      });
      setEditingId(null);
      loadPricing();
    } catch (error) {
      console.error("Error saving pricing:", error);
      alert(error.message);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      campaign_type: item.campaign_type,
      price_per_number: item.price_per_number,
      min_numbers: item.min_numbers,
      max_numbers: item.max_numbers || "",
      status: item.status
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this pricing tier?")) return;
    
    try {
      await fetchApi(`/campaigns/admin/pricing/${id}`, {
        method: "DELETE"
      });
      loadPricing();
    } catch (error) {
      console.error("Error deleting pricing:", error);
      alert(error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="campaign-pricing-modal-overlay">
      <div className="campaign-pricing-modal">
        <div className="campaign-pricing-modal-header">
          <h2 className="campaign-pricing-modal-title">Campaign Pricing Management</h2>
          <button onClick={onClose} className="campaign-pricing-modal-close">
            <X size={24} />
          </button>
        </div>

        <div className="campaign-pricing-modal-content">
          {/* Form Add/Edit Pricing */}
          <div className="pricing-form">
            <h3 className="pricing-form-title">
              {editingId ? "Edit" : "Add New"} Pricing Tier
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Campaign Type</label>
                  <select
                    value={formData.campaign_type}
                    onChange={(e) => setFormData({...formData, campaign_type: e.target.value})}
                    className="form-select"
                    required
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Price Per Number ($)</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    value={formData.price_per_number}
                    onChange={(e) => setFormData({...formData, price_per_number: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-grid form-grid-3">
                <div className="form-group">
                  <label className="form-label">Minimum Numbers</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.min_numbers}
                    onChange={(e) => setFormData({...formData, min_numbers: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Maximum Numbers (optional)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_numbers}
                    onChange={(e) => setFormData({...formData, max_numbers: e.target.value})}
                    className="form-input"
                    placeholder="No limit"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="form-select"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-buttons">
                <button type="submit" className="btn btn-primary">
                  {editingId ? "Update" : "Add"} Pricing Tier
                </button>
                {editingId && (
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({
                        campaign_type: "whatsapp",
                        price_per_number: "",
                        min_numbers: "",
                        max_numbers: "",
                        status: "active"
                      });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Pricing Table */}
          <div className="pricing-table">
            <h3 className="pricing-table-title">Current Pricing Tiers</h3>
            {loading ? (
              <div className="text-center loading-text">Loading...</div>
            ) : (
              <div className="pricing-table-container">
                <table className="pricing-table-table">
                  <thead>
                    <tr>
                      <th className="pricing-table-th">Type</th>
                      <th className="pricing-table-th">Price/Number</th>
                      <th className="pricing-table-th text-right">Min Numbers</th>
                      <th className="pricing-table-th text-right">Max Numbers</th>
                      <th className="pricing-table-th">Status</th>
                      <th className="pricing-table-th">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricing.map((item) => (
                      <tr key={item.id} className="pricing-table-tr">
                        <td className="pricing-table-td">{item.campaign_type.toUpperCase()}</td>
                        <td className="pricing-table-td">${item.price_per_number}</td>
                        <td className="pricing-table-td text-right">{item.min_numbers.toLocaleString()}</td>
                        <td className="pricing-table-td text-right">
                          {item.max_numbers ? item.max_numbers.toLocaleString() : "No limit"}
                        </td>
                        <td className="pricing-table-td">
                          <span className={`status-badge ${
                            item.status === 'active' ? 'status-active' : 'status-inactive'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="pricing-table-td">
                          <button 
                            onClick={() => handleEdit(item)}
                            className="btn btn-edit"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="btn btn-delete"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignPricingModal;