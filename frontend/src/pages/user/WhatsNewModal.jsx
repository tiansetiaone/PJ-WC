import React from "react";
import "./WhatsNewModal.css";

export default function WhatsNewModal({ onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header">
          <h2>What’s New</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Date */}
        <span className="date">23 June 2025, 15:09 WIB</span>

        {/* Title */}
        <h3>
          New Campaign Features at Blasterc – Ready to Boost Your Business?
        </h3>

        {/* Description */}
        <p>
          Hey Blasterian!
          <br />
          We’re launching new updates to make your bulk WhatsApp campaigns even
          smoother!
        </p>

        {/* What's New List */}
        <div className="whats-new-list">
          <p>✨ WHAT’S NEW?</p>
          <ul>
            <li>✅ Fresh log in & registration interface</li>
            <li>✅ All-in-one dashboard: track credit & campaign stats</li>
            <li>✅ Upload campaign numbers via .TXT file!</li>
            <li>✅ Fast & secure USDT TRC20 deposit system</li>
            <li>✅ Active referral system – invite & earn 🌟</li>
            <li>✅ Full campaign history & real-time reports</li>
            <li>✅ Notifications now live on your dashboard!</li>
          </ul>
        </div>

        {/* Call to Action */}
        <p>
          📢 Start your campaign today!
          <br />
          Just prepare your message, contact list, and image —{" "}
          <span className="link-text">Blasterc</span> will blast it out for you!
        </p>

        <p>
          📈 Want better results?
          <br />
          Upgrade to a premium campaign and unlock all advanced features now!
        </p>

        <p>➡️ Head to the "Campaign" menu and launch in seconds.</p>

        {/* Footer */}
        <div className="modal-footer">
          <label>
            <input type="checkbox" /> Don’t show this again
          </label>
        </div>
      </div>
    </div>
  );
}
