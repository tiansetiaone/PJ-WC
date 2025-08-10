import React from 'react';
import '../style/Dashboard.css';
import AdminDashboard from '../components/Admin/AdminDashboard';

const UserDashboard = () => (
  <div>
    {/* Credit & Campaign Stats */}
    <div className="dashboard-grid">
      {/* Credit Box */}
      <div className="dashboard-card">
        <h2>Credit</h2>
        <p className="credit-value">0</p>
        <p className="credit-info">You don't have any balance, top up now.</p>
        <button className="btn-primary">+ Top Up Credit</button>
      </div>

      {/* Campaign Box */}
      <div className="dashboard-card">
        <h2>Campaign</h2>
        <div className="campaign-stats">
          <span className="success">✅ 0 Success</span>
          <span className="failed">❌ 0 Failed</span>
        </div>
        <button className="btn-link">View Campaign →</button>
      </div>
    </div>

    {/* What's New Section */}
    <div className="dashboard-card">
      <h2>What's New</h2>

      <div className="news-item">
        <p className="news-date">23 June 2025, 15:09 WIB</p>
        <h3 className="news-title">
          New Campaign Features at Blasterc – Ready to Boost Your Business?
        </h3>
        <ul className="news-list">
          <li>✅ Fresh login & registration interface</li>
          <li>✅ All-in-one dashboard: track credit & campaign stats</li>
          <li>✅ Upload campaign numbers via .TXT file</li>
          <li>✅ Fast & secure USDT TRC20 deposit system</li>
          <li>✅ Active referral system – invite & earn ✨</li>
          <li>✅ Full campaign history & real-time reports</li>
          <li>✅ Notifications now live on your dashboard!</li>
        </ul>
        <p>🚀 Start your campaign today! Just prepare your message, contact list, and image — <strong>Blasterc</strong> will blast it out for you!</p>
        <p>🔒 Upgrade to a premium campaign for advanced features!</p>
      </div>

      <hr />

      <div className="news-item">
        <p className="news-date">22 June 2025, 12:00 WIB</p>
        <h3 className="news-title">Ready to Launch Bigger WhatsApp Campaigns?</h3>
        <ul className="news-list">
          <li>✅ Send bulk messages faster</li>
          <li>✅ Upload numbers via .txt file</li>
          <li>✅ Add campaign images</li>
          <li>✅ Track results directly on your dashboard</li>
          <li>✅ Top up via USDT TRC20 with minimum 10 USDT</li>
        </ul>
        <p>📣 More credits = Wider reach = Better results.</p>
        <button className="btn-primary">+ Create Campaign</button>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const role = user.role || 'user';

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>
      <p>Welcome, {user.name || 'User'}!</p>

      {role === 'admin' ? (
        <AdminDashboard />
      ) : (
        <UserDashboard />
      )}
    </div>
  );
};

export default Dashboard;