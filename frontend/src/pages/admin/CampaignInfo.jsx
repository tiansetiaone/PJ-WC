import React, { useState, useEffect } from "react";
import "../../style/admin/CampaignInfo.css";
import { fetchApi } from "../../utils/api";

export default function CampaignInfo({ campaign, onClose, onReject, refreshList }) {
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState("");
  const [userCredit, setUserCredit] = useState(null);
  const [campaignType, setCampaignType] = useState("N/A");
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [loadingNumbers, setLoadingNumbers] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      try {
        if (campaign?.id) {
          // Gunakan endpoint admin untuk mendapatkan detail campaign lengkap
          const res = await fetchApi(`/campaigns/admin/campaigns/${campaign.id}`);
          
          if (res.success) {
            // Set data campaign yang lengkap
            const campaignData = res.data;
            setCampaignType(formatCampaignType(campaignData.campaign_type));
            
            // Debug untuk memastikan data campaign_type ada
            console.log('Campaign type from API:', campaignData.campaign_type);
          }
        }
      } catch (err) {
        console.error("Error fetching campaign details:", err);
        setCampaignType("N/A");
      }
    };

    const fetchUserCredit = async () => {
      try {
        if (campaign?.user_id) {
          const res = await fetchApi(`/deposits/admin/user-credit/${campaign.user_id}`);
          if (res.success) {
            setUserCredit(res.data);
          } else {
            setUserCredit({ total_credit: 0, balance: 0 });
          }
        }
      } catch (err) {
        console.error("Error fetch user credit:", err);
        setUserCredit({ total_credit: 0, balance: 0 });
      }
    };

    if (campaign) {
      fetchCampaignDetails();
      fetchUserCredit();
    }
  }, [campaign]);

  // Fungsi untuk mengambil data nomor telepon
  const fetchPhoneNumbers = async () => {
    if (!campaign?.id) return;
    
    try {
      setLoadingNumbers(true);
      const res = await fetchApi(`/campaigns/admin/campaigns/${campaign.id}/numbers`);
      
      if (res.success) {
        setPhoneNumbers(res.data || []);
      } else {
        setPhoneNumbers([]);
      }
    } catch (err) {
      console.error("Error fetching phone numbers:", err);
      setPhoneNumbers([]);
    } finally {
      setLoadingNumbers(false);
    }
  };

  // Toggle tampilan nomor telepon
  const togglePhoneNumbers = async () => {
    if (!showNumbers && phoneNumbers.length === 0) {
      await fetchPhoneNumbers();
    }
    setShowNumbers(!showNumbers);
  };

  // Fungsi untuk menentukan campaign type
  const determineCampaignType = (campaignData) => {
    if (campaignData.campaign_type) {
      setCampaignType(formatCampaignType(campaignData.campaign_type));
      return;
    }
    
    if (campaignData.type) {
      setCampaignType(formatCampaignType(campaignData.type));
      return;
    }
    
    if (campaignData.campaignType) {
      setCampaignType(formatCampaignType(campaignData.campaignType));
      return;
    }
    
    if (campaignData.campaign_type_name) {
      setCampaignType(formatCampaignType(campaignData.campaign_type_name));
      return;
    }
    
    setCampaignType("N/A");
  };

  // Helper function untuk memformat campaign type
  const formatCampaignType = (type) => {
    if (!type || typeof type !== 'string') return "N/A";
    
    const lowerType = type.toLowerCase().trim();
    
    switch (lowerType) {
      case "whatsapp":
        return "WhatsApp";
      case "sms":
        return "SMS";
      case "email":
        return "Email";
      case "telegram":
        return "Telegram";
      case "push_notification":
      case "push-notification":
        return "Push Notification";
      default:
        return type
          .split(/[_\s]+/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
    }
  };

  if (!campaign) return null;

  // Tentukan URL gambar, fallback jika null
  const imageUrl = campaign.image
    ? `http://localhost:5000${
        campaign.image.startsWith("/") ? campaign.image : "/" + campaign.image
      }`
    : campaign.image_url
    ? `http://localhost:5000${
        campaign.image_url.startsWith("/") ? campaign.image_url : "/" + campaign.image_url
      }`
    : null;

  // cek apakah campaign sudah selesai statusnya
  const isFinal = ["approved", "success", "rejected", "failed"].includes(campaign.status);

  // Fungsi untuk mendapatkan status display
  const getStatusDisplay = () => {
    switch (campaign.status) {
      case "on_process":
      case "checking_campaign":
        return "Checking Campaign";
      case "success":
        return "Campaign Success";
      case "failed":
        return "Campaign Failed";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "pending":
        return "Pending";
      default:
        return campaign.status || "Unknown";
    }
  };

  // Fungsi untuk mendapatkan nilai dari berbagai kemungkinan key
  const getCampaignValue = (keys, defaultValue = "N/A") => {
    for (const key of keys) {
      if (campaign[key] !== undefined && campaign[key] !== null && campaign[key] !== "") {
        return campaign[key];
      }
    }
    return defaultValue;
  };

  // === Fungsi Approve Campaign ===
  const handleApprove = async () => {
    if (!campaign?.id) return;

    const confirmMessage = `Approve campaign "${getCampaignValue(['name', 'campaign_name'], 'Unnamed Campaign')}"?\n\n` +
      `User: ${getCampaignValue(['user', 'creator_name'], 'N/A')}\n` +
      `Campaign Type: ${campaignType}\n` +
      `Total Number: ${getCampaignValue(['numbers', 'total_numbers'], 0)}\n` +
      `Cost: $${campaign.total_cost ? campaign.total_cost.toFixed(4) : '0.0000'}\n` +
      `User Credit: $${userCredit?.total_credit ? userCredit.total_credit.toFixed(4) : '0.0000'}\n` +
      `Balance: $${userCredit?.balance ? userCredit.balance.toFixed(4) : '0.0000'}`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setIsApproving(true);
      setError("");

      const res = await fetchApi(`/campaigns/admin/campaigns/${campaign.id}/approve`, {
        method: "POST",
        body: {
          user_id: campaign.user_id,
          amount: campaign.total_cost || 0
        }
      });

      if (res.success) {
        alert(
          `✅ Campaign approved!\n\nAmount Deducted: $${res.amount_deducted}\nRemaining Credit: $${res.remaining_credit}`
        );
        if (refreshList) refreshList();
        onClose();
      } else {
        throw new Error(res.error || "Failed to approve campaign");
      }
    } catch (err) {
      console.error("Approve error:", err);
      setError(err.message || "Failed to approve campaign");
      alert(`❌ Failed to approve: ${err.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  // === Fungsi Reject Campaign ===
  const handleReject = async () => {
    if (!campaign?.id) return;

    if (!window.confirm(`Reject campaign "${getCampaignValue(['name', 'campaign_name'], 'Unnamed Campaign')}"?`)) {
      return;
    }

    try {
      await onReject(campaign);
      if (refreshList) refreshList();
      onClose();
    } catch (err) {
      console.error("Reject error:", err);
      setError(err.message || "Failed to reject campaign");
      alert(`❌ Failed to reject: ${err.message}`);
    }
  };

  return (
    <div className="campaign-container">
      <div className="campaign-card">
        {/* Title */}
        <h2 className="campaign-title">Campaign Info</h2>

        {/* Banner */}
        {imageUrl && (
          <div className="campaign-banner">
            <img
              src={imageUrl}
              alt={getCampaignValue(['name', 'campaign_name'], "Campaign Banner")}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/600x200?text=No+Image";
              }}
              style={{ width: "100%", height: "auto" }}
            />
          </div>
        )}

        {/* Campaign Details */}
        <div className="campaign-section">
          <h3 className="section-title">Campaign Details</h3>
          <div className="campaign-details">
            <p>
              <strong>ID Campaign:</strong> {campaign.id}
            </p>
            <p>
              <strong>Campaign Name:</strong> {getCampaignValue(['name', 'campaign_name'])}
            </p>
            <p>
              <strong>User:</strong> {getCampaignValue(['user', 'creator_name'])}
            </p>
            <p>
              <strong>User ID:</strong> {campaign.user_id || "N/A"}
            </p>
            <p>
              <strong>Campaign Type:</strong> 
              <span className="campaign-type-badge" data-type={campaignType.toLowerCase()}>
                {campaignType}
              </span>
            </p>
            <p>
              <strong>Total Numbers:</strong> 
              <span 
                className="numbers-link" 
                onClick={togglePhoneNumbers}
                style={{ cursor: 'pointer', color: '#007bff', textDecoration: 'underline' }}
              >
                {getCampaignValue(['numbers', 'total_numbers'], 0).toLocaleString()} numbers
                {showNumbers ? ' ▲' : ' ▼'}
              </span>
            </p>
            <p>
              <strong>Price per Number:</strong> ${getCampaignValue(['price_per_number'], 0).toFixed(4)}
            </p>
            <p>
              <strong>Total Cost:</strong> ${getCampaignValue(['total_cost'], 0).toFixed(4)}
            </p>
            <p>
              <strong>Status:</strong> 
              <span className={`status-badge status-${campaign.status}`}>
                {getStatusDisplay()}
              </span>
            </p>
            <p>
              <strong>Created At:</strong> {campaign.created_at ? new Date(campaign.created_at).toLocaleString() : "N/A"}
            </p>
          </div>

          {/* Phone Numbers Detail */}
          {showNumbers && (
            <div className="phone-numbers-section">
              <h4 className="sub-section-title">Phone Numbers Details</h4>
              {loadingNumbers ? (
                <p>Loading phone numbers...</p>
              ) : phoneNumbers.length > 0 ? (
                <div className="phone-numbers-list">
                  <div className="numbers-table-container">
                    <table className="numbers-table">
                      <thead>
                        <tr>
                          <th>No</th>
                          <th>Phone Number</th>
                          {/* <th>Status</th> */}
                        </tr>
                      </thead>
                      <tbody>
                        {phoneNumbers.map((number, index) => (
                          <tr key={number.id || index}>
                            <td>{index + 1}</td>
                            <td>{number.phone_number}</td>
                            {/* <td>
                              <span className={`number-status status-${number.status || 'pending'}`}>
                                {number.status || 'Pending'}
                              </span>
                            </td> */}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="numbers-summary">
                    <p>Total: {phoneNumbers.length} numbers</p>
                    {/* <p>
                      Success: {phoneNumbers.filter(n => n.status === 'success').length} | 
                      Failed: {phoneNumbers.filter(n => n.status === 'failed').length} | 
                      Pending: {phoneNumbers.filter(n => !n.status || n.status === 'pending').length}
                    </p> */}
                  </div>
                </div>
              ) : (
                <p>No phone numbers found for this campaign.</p>
              )}
            </div>
          )}
        </div>

        {/* User Credit Info */}
        {userCredit && (
          <div className="campaign-section">
            <h3 className="section-title">User Credit Information</h3>
            <div className="credit-details">
              <p>
                <strong>Total Credit:</strong> ${userCredit.total_credit ? userCredit.total_credit.toFixed(4) : '0.0000'}
              </p>
              <p>
                <strong>USDT Balance:</strong> ${userCredit.balance ? userCredit.balance.toFixed(4) : '0.0000'}
              </p>
              {userCredit.username && (
                <p>
                  <strong>Username:</strong> {userCredit.username}
                </p>
              )}
              {userCredit.email && (
                <p>
                  <strong>Email:</strong> {userCredit.email}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Campaign Message */}
        {campaign.message && (
          <div className="campaign-section">
            <h3 className="section-title">Campaign Message</h3>
            <div className="campaign-message">
              {campaign.message}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-section">
            <p className="error-text">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="campaign-actions">
          <button className="btn-back" onClick={onClose}>
            Back
          </button>

          {(campaign.status === "on_process" || campaign.status === "checking_campaign") && (
            <>
              <button
                className="btn-reject"
                onClick={handleReject}
                disabled={isApproving || isFinal}
              >
                Reject
              </button>

              <button
                className="btn-approve"
                onClick={handleApprove}
                disabled={isApproving || isFinal}
              >
                {isApproving ? "Approving..." : "Approve"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}