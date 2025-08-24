import React from "react";
import "../../style/admin/CampaignInfo.css";

export default function CampaignInfo({
  campaign,
  onClose,
  onApprove,
  onReject,
}) {
  if (!campaign) return null; // jaga-jaga kalau modal terbuka tanpa data

  return (
    <div className="campaign-container">
      <div className="campaign-card">
        {/* Title */}
        <h2 className="campaign-title">Campaign Info</h2>

        {/* Banner */}
        {campaign.image && (
          <div className="campaign-banner">
            <img src={campaign.image} alt={campaign.name} />
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
              <strong>Campaign Name:</strong> {campaign.name}
            </p>
            <p>
              <strong>User:</strong> {campaign.user}
            </p>
            <p>
              <strong>Sum of Number:</strong> {campaign.numbers} numbers
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
          <button
            className="btn-back"
            onClick={onClose}
          >
            Back
          </button>

          <button
            className="btn-reject"
            onClick={() => onReject(campaign.id)}
          >
            Reject
          </button>

          <button
            className="btn-approve"
            onClick={() => onApprove(campaign.id)}
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
