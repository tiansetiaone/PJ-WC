import React from "react";
import "./selectCampaign.css";

export default function SelectCampaign() {
  return (
    <div className="sc-root">
      <h2 className="sc-title">Select Campaign</h2>
      <p className="sc-desc">
        Please select the channel for your campaign. You can choose to reach your audience via SMS for direct text messages or WhatsApp for a more interactive experience.
      </p>

      <div className="sc-options">
        <div className="sc-option">
          <div className="sc-image">💬</div>
          <span className="sc-label">WhatsApp Campaign</span>
        </div>
        <div className="sc-option">
          <div className="sc-image">📱</div>
          <span className="sc-label">SMS Campaign</span>
        </div>
      </div>

      <div className="sc-actions">
        <button className="sc-btn sc-btn-back">Back</button>
        <button className="sc-btn sc-btn-next">Next</button>
      </div>
    </div>
  );
}