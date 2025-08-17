import React from "react";

export default function Dashboard() {
  return (
    <div className="dashboard-wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <img src="/logo.svg" alt="Blasterc" />
        </div>
        <nav>
          <ul>
            <li className="active">Dashboard</li>
            <li>Campaign</li>
            <li>Deposit</li>
            <li>Referral</li>
            <li>Contact Support</li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="topbar">
          <div className="profile-icon"></div>
        </header>

        <div className="dashboard-content">
          {/* Credit & Campaign */}
          <div className="stats">
            <div className="card credit-card">
              <h3>Credit</h3>
              <p className="credit-amount">0</p>
              <p className="credit-info">
                You don’t have any balance, top up now.
              </p>
              <button className="btn-primary">+ Top Up Credit</button>
            </div>

            <div className="card campaign-card">
              <h3>Campaign</h3>
              <div className="campaign-stats">
                <span className="success">0 Success</span>
                <span className="failed">0 Failed</span>
              </div>
              <button className="btn-link">View Campaign →</button>
            </div>
          </div>

          {/* What's New */}
          <section className="whats-new">
            <h2>What’s New</h2>
            <div className="news-item">
              <span className="date">23 June 2025, 15:09 WIB</span>
              <h3>New Campaign Features at Blasterc – Ready to Boost Your Business?</h3>
              <p>Hey Blasterian! ...</p>
              {/* isi list fitur bisa lanjut */}
            </div>

            <div className="news-item">
              <span className="date">22 June 2025, 12:00 WIB</span>
              <h3>Ready to Launch Bigger WhatsApp Campaigns?</h3>
              <p>Hey Blasterian! ...</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
