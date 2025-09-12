import React, { useState, useEffect } from "react";
import { fetchApi } from "../../utils/api";

export default function CampaignPricing() {
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
    loadPricing();
  }, []);

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
    // PERBAIKAN: Gunakan window.confirm instead of confirm
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="admin-pricing">
      <h2>Campaign Pricing Management</h2>
      
      {/* Form Add/Edit Pricing */}
      <div className="pricing-form">
        <h3>{editingId ? "Edit" : "Add New"} Pricing Tier</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Campaign Type</label>
              <select
                value={formData.campaign_type}
                onChange={(e) => setFormData({...formData, campaign_type: e.target.value})}
                required
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
              </select>
            </div>

            <div className="form-group">
              <label>Price Per Number ($)</label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                value={formData.price_per_number}
                onChange={(e) => setFormData({...formData, price_per_number: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Minimum Numbers</label>
              <input
                type="number"
                min="1"
                value={formData.min_numbers}
                onChange={(e) => setFormData({...formData, min_numbers: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Maximum Numbers (optional)</label>
              <input
                type="number"
                min="1"
                value={formData.max_numbers}
                onChange={(e) => setFormData({...formData, max_numbers: e.target.value})}
                placeholder="Leave empty for no limit"
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary">
            {editingId ? "Update" : "Add"} Pricing Tier
          </button>
          {editingId && (
            <button 
              type="button" 
              className="btn-secondary"
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
        </form>
      </div>

      {/* Pricing Table */}
      <div className="pricing-table">
        <h3>Current Pricing Tiers</h3>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Price/Number</th>
              <th>Min Numbers</th>
              <th>Max Numbers</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pricing.map((item) => (
              <tr key={item.id}>
                <td>{item.campaign_type.toUpperCase()}</td>
                <td>${item.price_per_number}</td>
                <td>{item.min_numbers.toLocaleString()}</td>
                <td>{item.max_numbers ? item.max_numbers.toLocaleString() : "No limit"}</td>
                <td>
                  <span className={`status ${item.status}`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => handleEdit(item)}
                    className="btn-edit"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="btn-delete"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}