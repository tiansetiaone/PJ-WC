import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchApi } from "../../utils/api";
import "../../style/user/CreateCampaignUsers2.css";

export default function CreateCampaignSMS() {
  const [formData, setFormData] = useState({
    campaign_name: "",
    campaign_date: "",
    message: "",
    campaign_type: "sms",
    numbersFile: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "numbersFile" && files && files[0]) {
      setFormData((prev) => ({ ...prev, numbersFile: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const formPayload = new FormData();
      formPayload.append("campaign_name", formData.campaign_name);
      formPayload.append("campaign_date", formData.campaign_date);
      formPayload.append("message", formData.message);
      formPayload.append("campaign_type", formData.campaign_type);

      const data = await fetchApi("/campaigns", {
        method: "POST",
        body: formPayload,
      });

      if (data.success && formData.numbersFile) {
        const numbersPayload = new FormData();
        numbersPayload.append("numbersFile", formData.numbersFile);

        await fetchApi(`/campaigns/${data.campaign_id}/numbers`, {
          method: "POST",
          body: numbersPayload,
        });
      }

      if (data.success) {
        navigate("/campaign");
      } else {
        throw new Error(data.message || "Failed to create campaign");
      }
    } catch (err) {
      setError(err.message || "Failed to create campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="campaign-containers">
      {/* Form Section */}
      <div className="campaign-form">
        <h2>Create Campaign</h2>
        <h3>SMS Campaign Form</h3>

        {error && <p className="error-text">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label>
            Campaign Name <span>*</span>
          </label>
          <input
            type="text"
            name="campaign_name"
            placeholder="BLACK FRIDAY"
            value={formData.campaign_name}
            onChange={handleChange}
            required
          />

          <label>
            Channel <span>*</span>
          </label>
          <input type="text" value="SMS" disabled />

          <label>
            Campaign Date <span>*</span>
          </label>
          <input
            type="date"
            name="campaign_date"
            value={formData.campaign_date}
            onChange={handleChange}
            required
          />

          <label>
            Campaign Numbers File <span>*</span>
          </label>
          <input
            type="file"
            name="numbersFile"
            accept=".txt"
            onChange={handleChange}
            required
          />
          <small>TXT max. 1 MB</small>

          <label>
            Message <span>*</span>
          </label>
          <textarea
            name="message"
            rows="4"
            placeholder="🔥 Exclusive Black Friday Offer..."
            value={formData.message}
            onChange={handleChange}
            required
          ></textarea>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Campaign"}
          </button>
        </form>
      </div>

      {/* Preview Section */}
      <div className="campaign-preview">
        <div className="phone-frame sms-preview">
          <img
            src="/mockups/iphone-mockup.png" // <- ganti sesuai lokasi file mockup png yang kamu upload
            alt="SMS Preview"
            className="phone-mockup"
          />
          <div className="sms-bubble">
            <p className="title">{formData.campaign_name || "Campaign Name"}</p>
            <p>{formData.message || "Your SMS message will appear here"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
