import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchApi } from "../../utils/api";
import "../../style/user/CreateCampaignUsers.css";
import phoneMockup from "../../assets/phone-mockup-image.png"; 

export default function CreateCampaignWhatsApp() {
  const [formData, setFormData] = useState({
    campaign_name: "",
    campaign_date: "",
    message: "",
    campaign_type: "whatsapp",
    image: null,
    numbersFile: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [userBalance, setUserBalance] = useState(0);

  const navigate = useNavigate();

  // Fungsi untuk mengambil saldo user dari local storage
  const getUserBalanceFromStorage = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return parseFloat(user.balance || 0);
      }
      return 0;
    } catch (error) {
      console.error("Error getting balance from storage:", error);
      return 0;
    }
  };

  useEffect(() => {
    // Ambil saldo dari local storage saat komponen dimount
    const balance = getUserBalanceFromStorage();
    setUserBalance(balance);
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files && files[0]) {
      const file = files[0];
      setPreviewImage(URL.createObjectURL(file));
      setFormData((prev) => ({ ...prev, image: file }));
    } else if (name === "numbersFile" && files && files[0]) {
      setFormData((prev) => ({ ...prev, numbersFile: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Cek saldo sebelum submit (dari local storage)
    const currentBalance = getUserBalanceFromStorage();
    setUserBalance(currentBalance); // Update state untuk UI
    
    if (currentBalance <= 0) {
      setError("You don't have enough credit to create a campaign. Please top up first.");
      return;
    }
    
    setIsSubmitting(true);

    try {
      // 1. Buat campaign
      const formPayload = new FormData();
      formPayload.append("campaign_name", formData.campaign_name);
      formPayload.append("campaign_date", formData.campaign_date);
      formPayload.append("message", formData.message);
      formPayload.append("campaign_type", formData.campaign_type);

      if (formData.image) {
        formPayload.append("image", formData.image);
      }

      const data = await fetchApi("/campaigns", {
        method: "POST",
        body: formPayload,
      });

      // 2. Upload numbers file TXT
      if (data.success && formData.numbersFile) {
        const numbersPayload = new FormData();
        numbersPayload.append("numbersFile", formData.numbersFile);

        await fetchApi(`/campaigns/${data.campaign_id}/numbers`, {
          method: "POST",
          body: numbersPayload,
        });
      }

      // 3. Redirect ke dashboard
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
        <h3>WhatsApp Campaign Form</h3>
        
        {/* Tampilkan saldo user */}
        <div className="balance-info">
          <p>Your current balance: <strong>${userBalance.toFixed(2)}</strong></p>
          {userBalance <= 0 && (
            <p className="error-text">
              You don't have enough credit. Please <a href="/deposit">top up</a> first.
            </p>
          )}
        </div>

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
          <input type="text" value="WhatsApp" disabled />

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
            Campaign Image
          </label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
          />
          <small>JPG, PNG max. 5 MB</small>

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

          <button 
            type="submit" 
            disabled={isSubmitting || userBalance <= 0}
            className={userBalance <= 0 ? "disabled-btn" : ""}
          >
            {isSubmitting ? "Creating..." : userBalance <= 0 ? "Insufficient Balance" : "Create Campaign"}
          </button>
        </form>
      </div>

      {/* Preview Section */}
      <div className="campaign-preview">
        <div className="phone-frame-user">
          <img src={phoneMockup} alt="Phone Mockup" className="phone-mockup" />
          
          <div className="screen-content">
            {previewImage ? (
              <div className="img-msg">
                <img src={previewImage} alt="Preview" className="preview-img" />
                <div className="preview-message">
                  <p className="title">{formData.campaign_name || "Campaign Name"}</p>
                  <p>{formData.message || "Your message will appear here"}</p>
                </div>
              </div>
            ) : (
              <div className="preview-message">
                <p className="title">{formData.campaign_name || "Campaign Name"}</p>
                <p>{formData.message || "Your message will appear here"}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}