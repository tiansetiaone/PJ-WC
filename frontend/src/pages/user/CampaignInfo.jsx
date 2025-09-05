// CampaignInfo.jsx
import React from "react";
import "../../style/user/CampaignInfo.css";

export default function CampaignInfo({ campaign }) {
  if (!campaign) return null;

  // Pastikan URL gambar absolute ke backend
  const imageUrl = campaign.image_url
    ? `http://localhost:5000${
        campaign.image_url.startsWith("/")
          ? campaign.image_url
          : "/" + campaign.image_url
      }`
    : null;

  return (
    <div className="campaign-info-container">
      <div className="campaign-card">
        <h2 className="campaign-title">Campaign Info</h2>

        {/* Banner */}
        {imageUrl && (
          <div className="campaign-banner">
            <img
              src={imageUrl}
              alt={campaign.campaign_name || "Campaign Banner"}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "https://via.placeholder.com/600x200?text=No+Image";
              }}
              style={{ width: "100%", height: "auto" }}
            />
          </div>
        )}

        {/* Campaign Details */}
        <div className="campaign-section">
          <h3>Campaign</h3>
          <div className="campaign-details">
            <p>
              <strong>ID Campaign:</strong> 
              {Math.floor(new Date(campaign.created_at).getTime() / 1000)}
            </p>
            <p>
              <strong>Campaign Name:</strong> {campaign.campaign_name}
            </p>
            <p>
              <strong>Channel:</strong> {campaign.campaign_type}
            </p>
            <p>
              <strong>Status:</strong> {campaign.status}
            </p>
            <p>
              <strong>Created At:</strong>{" "}
              {new Date(campaign.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="campaign-section">
          <h3>Campaign Message</h3>
          <p className="campaign-message">{campaign.message}</p>
        </div>
      </div>
    </div>
  );
}
