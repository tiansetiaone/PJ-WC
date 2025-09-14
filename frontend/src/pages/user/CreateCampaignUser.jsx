import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchApi } from "../../utils/api";
import "../../style/user/CreateCampaignUsers.css";
import phoneMockup from "../../assets/phone-mockup-image.png"; 

const readFileContent = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

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
  const [userTotalCredit, setUserTotalCredit] = useState(0);
  const [costEstimate, setCostEstimate] = useState(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);

  const navigate = useNavigate();

  const getUserCreditFromStorage = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return {
          balance: parseFloat(user.balance || 0),
          total_credit: parseFloat(user.total_credit || 0)
        };
      }
      return { balance: 0, total_credit: 0 };
    } catch (error) {
      console.error("Error getting credit from storage:", error);
      return { balance: 0, total_credit: 0 };
    }
  };

  useEffect(() => {
    const fetchUserCredit = async () => {
      try {
        const response = await fetchApi('/deposits/user/credit');
        if (response.success) {
          setUserBalance(response.data.balance);
          setUserTotalCredit(response.data.total_credit);
          
          const userData = localStorage.getItem('user');
          if (userData) {
            const user = JSON.parse(userData);
            user.balance = response.data.balance;
            user.total_credit = response.data.total_credit;
            localStorage.setItem('user', JSON.stringify(user));
          }
        }
      } catch (error) {
        console.error('Error fetching user credit:', error);
      }
    };
    
    fetchUserCredit();
  }, []);

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
    if (name === "image" && files && files[0]) {
      const file = files[0];
      setPreviewImage(URL.createObjectURL(file));
      setFormData((prev) => ({ ...prev, image: file }));
    } else if (name === "numbersFile" && files && files[0]) {
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

    // PERBAIKAN: Gunakan total_credit bukan balance
    const currentCredit = getUserCreditFromStorage();
    setUserBalance(currentCredit.balance);
    setUserTotalCredit(currentCredit.total_credit);

    // Validasi berdasarkan total_credit
    if (costEstimate && currentCredit.total_credit < costEstimate.total_cost) {
      setError(`You need $${costEstimate.total_cost.toFixed(4)} campaign credit but only have $${currentCredit.total_credit.toFixed(4)}`);
      return;
    }

    if (currentCredit.total_credit <= 0) {
      setError("You don't have enough campaign credit to create a campaign. Please top up first.");
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

      if (formData.image) {
        formPayload.append("image", formData.image);
      }

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
      <div className="campaign-form">
        <h2>Create Campaign</h2>
        <h3>WhatsApp Campaign Form</h3>
        
        <div className="balance-info">
          {/* <p>Your USDT Balance: <strong>${userBalance.toFixed(4)}</strong></p> */}
          <p>Your Campaign Credit: <strong>{userTotalCredit}</strong></p>
          {userTotalCredit <= 0 && (
            <p className="error-text">
              You don't have enough campaign credit. Please <a href="/deposit">top up</a> first.
            </p>
          )}
        </div>

        {error && <p className="error-text">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label>Campaign Name <span>*</span></label>
          <input
            type="text"
            name="campaign_name"
            placeholder="BLACK FRIDAY"
            value={formData.campaign_name}
            onChange={handleChange}
            required
          />

          <label>Channel <span>*</span></label>
          <input type="text" value="WhatsApp" disabled />

          <label>Campaign Date <span>*</span></label>
          <input
            type="date"
            name="campaign_date"
            value={formData.campaign_date}
            onChange={handleChange}
            required
          />

          <label>Campaign Image</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
          />
          <small>JPG, PNG max. 5 MB</small>

          <label>Campaign Numbers File <span>*</span></label>
          <input
            type="file"
            name="numbersFile"
            accept=".txt"
            onChange={handleChange}
            required
          />
          <small>TXT max. 1 MB</small>

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
                <p>Price per Number: <strong>{costEstimate.price_per_number} Credit</strong></p>
                <p className="total-cost">
                  Total Cost: <strong>{costEstimate.total_cost}</strong>
                </p>
                <p className="balance-check">
                  Your Campaign Credit: {userTotalCredit} - 
                  Cost: {costEstimate.total_cost} = 
                  Remaining Credit: <strong>{(userTotalCredit - costEstimate.total_cost)}</strong>
                </p>
                {userTotalCredit < costEstimate.total_cost && (
                  <p className="error-text">Insufficient campaign credit!</p>
                )}
              </div>
            </div>
          )}

          <label>Message <span>*</span></label>
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
            disabled={isSubmitting || userTotalCredit <= 0 || (costEstimate && userTotalCredit < costEstimate.total_cost)}
            className={userTotalCredit <= 0 || (costEstimate && userTotalCredit < costEstimate.total_cost) ? "disabled-btn" : ""}
          >
            {isSubmitting ? "Creating..." : 
             userTotalCredit <= 0 ? "Insufficient Credit" :
             (costEstimate && userTotalCredit < costEstimate.total_cost) ? "Not Enough Credit" :
             "Create Campaign"}
          </button>
        </form>
      </div>

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