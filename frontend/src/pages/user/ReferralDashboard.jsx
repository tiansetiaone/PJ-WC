import React from "react";
import "./ReferralDashboard.css";

export default function ReferralDashboard() {
  return (
    <div className="referral-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Referral</span>
      </div>

      <h2 className="page-title">Referral</h2>

      <div className="top-section">
        {/* Earn with Blasterc */}
        <div className="card earn-card">
          <h3>Earn with Blasterc</h3>
          <p>
            Invite your friends to Blasterc dashboard, if they sign up, you will
            get commission to be converted to USDT.
          </p>
          <div className="steps">
            <div>
              <strong>Send Invitation</strong>
              <p>Send your referral link to friends and let them know how useful Blasterc is!</p>
            </div>
            <div>
              <strong>Registration</strong>
              <p>Let your friends sign up to our services using your personal referral code!</p>
            </div>
            <div>
              <strong>Use Blasterc Hourly</strong>
              <p>You get commission to be converted to USDT.</p>
            </div>
          </div>
        </div>

        {/* Share Referral Link */}
        <div className="card share-card">
          <h3>Share The Referral Link!</h3>
          <p>
            Invite your friends to Blasterc dashboard, if they sign up, you will get commission to be converted to USDT.
          </p>
          <div className="share-icons">
            <button className="icon-btn">🟢</button>
            <button className="icon-btn">❌</button>
            <button className="icon-btn">📩</button>
          </div>
          <div className="link-box">
            <input type="text" value="blasterc.id/invite/referral-code-XYZ789" readOnly />
            <button className="copy-btn">Copy Link</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats">
        <div className="stat-card">
          <p>Current Earnings</p>
          <h2>$0</h2>
          <span>Earning from shared link.</span>
        </div>
        <div className="stat-card">
          <p>Convert Earnings</p>
          <h2>$0</h2>
          <span>Lifetime convert.</span>
        </div>
        <div className="stat-card">
          <p>Total Visited</p>
          <h2>0</h2>
          <span>By clicked shared link.</span>
        </div>
        <div className="stat-card">
          <p>Total Registered</p>
          <h2>0</h2>
          <span>Converted from total visit.</span>
        </div>
      </div>

      {/* Registered Users */}
      <div className="card empty-section">
        <h3>Registered Users</h3>
        <p>You get $0.5 earnings on every user has registered.</p>
        <div className="empty-box">
          <img src="https://via.placeholder.com/150" alt="empty" />
          <p>No Registered Users Yet</p>
          <span>There are no users registered to your account at the moment. Please invite or register users to start managing them here.</span>
        </div>
      </div>

      {/* Converted Earnings History */}
      <div className="card empty-section">
        <h3>Converted Earnings History</h3>
        <div className="empty-box">
          <img src="https://via.placeholder.com/150" alt="empty" />
          <p>No Convert History Yet</p>
          <span>You haven’t made any earnings conversions yet. Once you convert your earnings, the history will appear here.</span>
        </div>
      </div>
    </div>
  );
}
