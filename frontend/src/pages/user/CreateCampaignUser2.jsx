import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchApi } from "../../utils/api";
import "../../style/user/CreateCampaignUsers2.css";
import phoneMockupsms from "../../assets/phone-mockup-image-sms.png"; 

// Tambahkan fungsi readFileContent di sini
const readFileContent = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

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
  const [previewImage, setPreviewImage] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [costEstimate, setCostEstimate] = useState(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);

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

  // Fungsi untuk estimasi biaya
  const estimateCost = async (file, campaignType) => {
    if (!file) {
      setCostEstimate(null);
      return;
    }
    
    setLoadingEstimate(true);
    try {
      const fileContent = await readFileContent(file);
      const numbers = fileContent.split(/\r?\n/)
        .map(num => num.trim())
        .filter(num => num !== "");
      
      const totalNumbers = numbers.length;
      
      if (totalNumbers === 0) {
        setCostEstimate(null);
        return;
      }
      
      // Hitung estimasi biaya
      const response = await fetchApi('/campaigns/estimate-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_type: campaignType,
          total_numbers: totalNumbers
        })
      });
      
      if (response.success) {
        setCostEstimate(response.data);
      }
    } catch (error) {
      console.error('Error estimating cost:', error);
      setCostEstimate(null);
    } finally {
      setLoadingEstimate(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "numbersFile" && files && files[0]) {
      const file = files[0];
      setFormData((prev) => ({ ...prev, numbersFile: file }));
      estimateCost(file, formData.campaign_type);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Cek saldo sebelum submit (dari local storage)
    const currentBalance = getUserBalanceFromStorage();
    setUserBalance(currentBalance);
    
    // Cek jika ada estimasi biaya dan saldo cukup
    if (costEstimate && currentBalance < costEstimate.total_cost) {
      setError(`You need $${costEstimate.total_cost.toFixed(4)} but only have $${currentBalance.toFixed(4)}`);
      return;
    }
    
    if (currentBalance <= 0) {
      setError("You don't have enough credit to create a campaign. Please top up first.");
      return;
    }
    
    if (!formData.numbersFile) {
      setError("Please upload a numbers file");
      return;
    }
    
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
        
        {/* Tampilkan saldo user */}
        <div className="balance-info">
          <p>Your current balance: <strong>${userBalance.toFixed(4)}</strong></p>
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

          {/* Tampilkan estimasi biaya */}
          {loadingEstimate && (
            <div className="cost-estimate loading">
              <p>Calculating cost estimate...</p>
            </div>
          )}

          {costEstimate && !loadingEstimate && (
            <div className="cost-estimate">
              <h4>Cost Estimate:</h4>
              <div className="cost-details">
                <p>Total Numbers: <strong>{costEstimate.total_numbers.toLocaleString()}</strong></p>
                <p>Price per Number: <strong>${costEstimate.price_per_number.toFixed(4)}</strong></p>
                <p className="total-cost">
                  Total Cost: <strong>${costEstimate.total_cost.toFixed(4)}</strong>
                </p>
                <p className="balance-check">
                  Your Balance: ${userBalance.toFixed(4)} - 
                  Cost: ${costEstimate.total_cost.toFixed(4)} = 
                  Remaining: <strong>${(userBalance - costEstimate.total_cost).toFixed(4)}</strong>
                </p>
                {userBalance < costEstimate.total_cost && (
                  <p className="error-text">Insufficient balance!</p>
                )}
              </div>
            </div>
          )}

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
            disabled={isSubmitting || userBalance <= 0 || (costEstimate && userBalance < costEstimate.total_cost)}
            className={userBalance <= 0 || (costEstimate && userBalance < costEstimate.total_cost) ? "disabled-btn" : ""}
          >
            {isSubmitting ? "Creating..." : 
             userBalance <= 0 ? "Insufficient Balance" :
             (costEstimate && userBalance < costEstimate.total_cost) ? "Not Enough Balance" :
             "Create Campaign"}
          </button>
        </form>
      </div>

      {/* Preview Section */}
      <div className="campaign-preview">
        <div className="phone-frame">
          <img src={phoneMockupsms} alt="Phone Mockup" className="phone-mockup" />
          
          <div className="screen-content">
            <div className="preview-message">
              <p className="title">{formData.campaign_name || "Campaign Name"}</p>
              <p>{formData.message || "Your SMS message will appear here"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}