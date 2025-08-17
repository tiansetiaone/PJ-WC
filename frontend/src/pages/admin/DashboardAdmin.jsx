import React from "react";
import "./../styles/Dashboard.css";

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">BLASTERC</div>
        <nav>
          <ul>
            <li className="active">Dashboard</li>
            <li>User Management</li>
            <li>Campaign Management</li>
            <li>Deposit Management</li>
            <li>Referral Settings</li>
            <li>Notification Management</li>
            <li>Ticket Support</li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <h1>Dashboard</h1>
          <div className="profile-icon">AD</div>
        </header>

        {/* Stats */}
        <section className="stats-grid">
          <div className="stat-card">
            <h3>User</h3>
            <p>Registered</p>
            <span className="green">0</span>
            <button>View User →</button>
          </div>
          <div className="stat-card">
            <h3>Campaign</h3>
            <p>Success</p>
            <span className="green">0</span>
            <p>Failed</p>
            <span className="red">0</span>
            <button>View Campaign →</button>
          </div>
          <div className="stat-card">
            <h3>Deposit</h3>
            <p>Received</p>
            <span className="green">0</span>
            <p>Failed</p>
            <span className="red">0</span>
            <button>View Deposit →</button>
          </div>
          <div className="stat-card">
            <h3>Referral</h3>
            <p>Payouts</p>
            <span className="green">0</span>
            <p>Visited</p>
            <span className="red">0</span>
            <button>View Referral →</button>
          </div>
        </section>

        {/* What's New */}
        <section className="whats-new">
          <h2>What's New</h2>
          <div className="news-item">
            <p className="date">23 June 2025, 15:09 WIB</p>
            <h3>New Campaign Features at Blasterc – Ready to Boost Your Business?</h3>
            <p>
              We’re launching new updates to make your bulk WhatsApp campaigns even smoother!
            </p>
            <ul>
              <li>Fresh log in & registration interface</li>
              <li>All-in-one dashboard: track credit & campaign stats</li>
              <li>Upload numbers via .TXT file</li>
              <li>Fast & secure USDT TRC20 deposit system</li>
              <li>Active referral system – invite & earn</li>
              <li>Full campaign history & real-time reports</li>
              <li>Notifications now live on your dashboard</li>
            </ul>
          </div>

          <div className="news-item">
            <p className="date">22 June 2025, 12:00 WIB</p>
            <h3>Ready to Launch Bigger WhatsApp Campaigns?</h3>
            <ul>
              <li>Send bulk messages faster</li>
              <li>Upload numbers via .txt file</li>
              <li>Add campaign images</li>
              <li>Track results directly on your dashboard</li>
              <li>Top up with USDT TRC20</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
