import React from "react";
import "./CampaignInfo.css";

export default function CampaignInfo() {
  return (
    <div className="campaign-container">
      <div className="campaign-card">
        {/* Header Title */}
        <h2 className="campaign-title">Campaign Info</h2>

        {/* Banner Image */}
        <div className="campaign-banner">
          <img
            src="https://via.placeholder.com/400x150.png?text=BLACK+FRIDAY"
            alt="Campaign Banner"
          />
        </div>

        {/* Campaign Details */}
        <div className="campaign-section">
          <h3 className="section-title">Campaign</h3>
          <div className="campaign-details">
            <p><strong>ID Campaign:</strong> M4pX***********9TqJ</p>
            <p><strong>Campaign Name:</strong> BLACK FRIDAY!</p>
            <p><strong>Channel:</strong> WhatsApp</p>
            <p><strong>Campaign Number:</strong> <a href="#">Test-DID/test123.txt</a></p>
            <p><strong>Sum of Number:</strong> 200 numbers</p>
            <p><strong>Campaign Image:</strong> <a href="#">campaign-image.png</a></p>
            <p><strong>Status:</strong> <span className="status-checking">🔄 Checking Campaign</span></p>
          </div>
        </div>

        {/* Campaign Message */}
        <div className="campaign-section">
          <h3 className="section-title">Campaign Message</h3>
          <p className="campaign-message">
            🔥 Exclusive Black Friday Offer: Limited-time discounts on your
            favorite products. Hurry, only while stocks last!
          </p>
        </div>

        {/* User's Request */}
        <div className="campaign-section">
          <h3 className="section-title">User’s Request</h3>
          <p><strong>Full Name:</strong> Tio Ramdan</p>
          <p><strong>Username:</strong> @tioramdan</p>
        </div>

        {/* Action Buttons */}
        <div className="campaign-actions">
          <button className="btn-back">Back</button>
          <button className="btn-reject">Reject</button>
          <button className="btn-approve">Approve</button>
        </div>
      </div>
    </div>
  );
}
