import React from "react";
import "../../style/user/selectCampaign.css";

export default function SelectCampaign({ onBack, onNext, onSelectChannel, selected }) {
  return (
    <div className="sc-root animate-pop">
      <h2 className="sc-title">Select Campaign</h2>
      <p className="sc-desc">
        Please select the channel for your campaign. You can choose to reach your audience via SMS for direct text messages or WhatsApp for a more interactive experience.
      </p>

      <div className="sc-options">
        <div
          className={`sc-option ${selected === "whatsapp" ? "active" : ""}`}
          onClick={() => onSelectChannel("whatsapp")}
        >
          <div className="sc-image">💬</div>
          <span className="sc-label">WhatsApp Campaign</span>
        </div>
        <div
          className={`sc-option ${selected === "sms" ? "active" : ""}`}
          onClick={() => onSelectChannel("sms")}
        >
          <div className="sc-image">📱</div>
          <span className="sc-label">SMS Campaign</span>
        </div>
      </div>

      <div className="sc-actions">
        <button className="sc-btn sc-btn-back" onClick={onBack}>
          Back
        </button>
        <button
          className="sc-btn sc-btn-next"
          onClick={onNext}
          disabled={!selected}
        >
          Next
        </button>
      </div>
    </div>
  );
}
