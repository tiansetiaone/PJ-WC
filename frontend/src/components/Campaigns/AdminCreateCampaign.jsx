import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminCreateCampaign = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    campaign_name: '',
    campaign_date: '',
    message: '',
    campaign_type: 'whatsapp',
    image_url: '',
    status: 'pending'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to create campaign');
      
      alert('Campaign created successfully');
      navigate('/admin/campaigns');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Campaign</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label className="block mb-2">Campaign Name</label>
          <input
            type="text"
            name="campaign_name"
            value={formData.campaign_name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="form-group">
          <label className="block mb-2">Campaign Date</label>
          <input
            type="date"
            name="campaign_date"
            value={formData.campaign_date}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="form-group">
          <label className="block mb-2">Campaign Type</label>
          <select
            name="campaign_type"
            value={formData.campaign_type}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
          </select>
        </div>

        <div className="form-group">
          <label className="block mb-2">Initial Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="processing">Processing</option>
          </select>
        </div>

        <div className="form-group">
          <label className="block mb-2">Message Content</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            rows="5"
            required
          />
        </div>

        {formData.campaign_type === 'whatsapp' && (
          <div className="form-group">
            <label className="block mb-2">Image URL (Optional)</label>
            <input
              type="url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/campaigns')}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Campaign
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminCreateCampaign;