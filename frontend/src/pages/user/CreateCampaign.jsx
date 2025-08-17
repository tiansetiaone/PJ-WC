import React, { useState } from "react";
import "./CreateCampaign.css";

export default function CreateCampaign() {
  const [formData, setFormData] = useState({
    campaignName: "",
    campaignDate: "",
    image: "",
    campaignNumber: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0].name : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
  };

  return (
    <div className="campaign-container">
      <div className="campaign-form">
        <h2>Create Campaign</h2>
        <h3>WhatsApp Campaign Form</h3>

        <form onSubmit={handleSubmit}>
          <label>
            Campaign Name <span>*</span>
          </label>
          <input
            type="text"
            name="campaignName"
            placeholder="BLACK FRIDAY"
            value={formData.campaignName}
            onChange={handleChange}
          />

          <label>
            Channel <span>*</span>
          </label>
          <input type="text" value="WhatsApp" disabled />

          <label>
            Campaign Date <span>*</span>
          </label>
          <input
            type="date"
            name="campaignDate"
            value={formData.campaignDate}
            onChange={handleChange}
          />

          <label>
            Image <span>*</span>
          </label>
          <input type="file" name="image" accept=".png,.jpg,.jpeg" onChange={handleChange} />
          <small>Import only PNG/JPG/JPEG file, max. 5 MB</small>

          <label>
            Campaign Number <span>*</span>
          </label>
          <input type="file" name="campaignNumber" accept=".txt" onChange={handleChange} />
          <small>Import only TXT file, max. 1 MB</small>

          <label>
            Message <span>*</span>
          </label>
          <textarea
            name="message"
            rows="4"
            placeholder="🔥 Exclusive Black Friday Offer..."
            value={formData.message}
            onChange={handleChange}
          ></textarea>

          <button type="submit">Create Campaign</button>
        </form>
      </div>

      <div className="campaign-preview">
        <div className="phone-frame">
          <img
            src="https://via.placeholder.com/200x400"
            alt="WhatsApp Preview"
          />
        </div>
      </div>
    </div>
  );
}
