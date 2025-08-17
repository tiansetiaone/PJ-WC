import React from "react";
import "./CampaignInfo.css";

export default function CampaignInfo() {
  return (
    <div className="campaign-info-container">
      {/* Card */}
      <div className="campaign-card">
        <h2 className="campaign-title">Campaign Info</h2>

        {/* Campaign Banner */}
        <div className="campaign-banner">
          <img
            src="https://via.placeholder.com/600x150.png?text=BLACK+FRIDAY"
            alt="Campaign Banner"
          />
        </div>

        {/* Campaign Details */}
        <div className="campaign-section">
          <h3>Campaign</h3>
          <div className="campaign-details">
            <p>
              <strong>ID Campaign:</strong> M4pX****************9TqJ
            </p>
            <p>
              <strong>Campaign Name:</strong> BLACK FRIDAY!
            </p>
            <p>
              <strong>Channel:</strong> WhatsApp
            </p>
            <p>
              <strong>Campaign Number:</strong> Test-DID/test123.txt
            </p>
            <p>
              <strong>Campaign Image:</strong>{" "}
              <a href="#" download>
                campaign-image.png ⬇
              </a>
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span className="status-checking">🔍 Checking Campaign</span>
            </p>
          </div>
        </div>

        {/* Campaign Message */}
        <div className="campaign-section">
          <h3>Campaign Message</h3>
          <p className="campaign-message">
            🔥 Exclusive Black Friday Offer: Limited-time discounts on your
            favorite products. Hurry, only while stocks last!
          </p>
        </div>

        {/* Back Button */}
        <div className="button-container">
          <button className="back-button">Back</button>
        </div>
      </div>
    </div>
  );
}
