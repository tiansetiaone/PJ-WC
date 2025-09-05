import React from "react";
import "../../style/admin/CampaignInfo.css";

export default function CampaignInfo({
  campaign,
  onClose,
  onApprove,
  onReject,
}) {
  if (!campaign) return null; // jaga-jaga kalau modal terbuka tanpa data

  // Tentukan URL gambar, fallback jika null
  const imageUrl = campaign.image_url
    ? `http://localhost:5000${
        campaign.image_url.startsWith("/")
          ? campaign.image_url
          : "/" + campaign.image_url
      }`
    : null;

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
          <h3 className="section-title">Campaign</h3>
          <div className="campaign-details">
            <p>
              <strong>ID Campaign:</strong> {campaign.id}
            </p>
            <p>
              <strong>Campaign Name:</strong> {campaign.campaign_name || campaign.name}
            </p>
            <p>
              <strong>User:</strong> {campaign.user || campaign.creator_name}
            </p>
            <p>
              <strong>Sum of Number:</strong> {campaign.numbers?.length ?? campaign.total_numbers ?? 0} numbers
            </p>
            <p>
              <strong>Status:</strong> {campaign.status}
            </p>
          </div>
        </div>

        {/* Campaign Message */}
        <div className="campaign-section">
          <h3 className="section-title">Campaign Message</h3>
          <p className="campaign-message">{campaign.message}</p>
        </div>

        {/* Action Buttons */}
        <div className="campaign-actions">
          <button className="btn-back" onClick={onClose}>
            Back
          </button>

          <button className="btn-reject" onClick={() => onReject(campaign.id)}>
            Reject
          </button>

          <button className="btn-approve" onClick={() => onApprove(campaign.id)}>
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
