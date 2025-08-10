import React from 'react';

const AdminDashboard = () => {
  const Card = ({ title, green, red, link }) => (
    <div className="admin-card">
      <h3>{title}</h3>
      <div className="admin-stats">
        <span className="green">✅ {green}</span>
        <span className="red">❌ {red}</span>
      </div>
      <button className="btn-link">{link} →</button>
    </div>
  );

  return (
    <div>
      <h1 className="dashboard-title">Admin Dashboard</h1>
      
      <div className="admin-grid">
        <Card title="User" green="0" red="0" link="View User" />
        <Card title="Campaign" green="0" red="0" link="View Campaign" />
        <Card title="Deposit" green="0" red="0" link="View Deposit" />
        <Card title="Referral" green="0" red="0" link="View Referral" />
      </div>

      <section className="news-section">
        <h2>What's New</h2>

        <div className="news-item">
          <p className="news-date">23 June 2025, 15:09 WIB</p>
          <h3>New Campaign Features at Blasterc</h3>
          <ul>
            <li>✅ Fresh login & registration interface</li>
            <li>✅ Upload campaign numbers via .TXT file</li>
            <li>✅ Secure USDT TRC20 deposit system</li>
            <li>✅ Referral system & Real-time reporting</li>
          </ul>
          <p>🎯 Start your campaign now with Blasterc!</p>
        </div>

        <div className="news-item">
          <p className="news-date">22 June 2025, 12:00 WIB</p>
          <h3>Ready to Launch Bigger WhatsApp Campaigns?</h3>
          <ul>
            <li>✅ Send bulk messages faster</li>
            <li>✅ Upload numbers via .TXT file</li>
            <li>✅ Track results on dashboard</li>
          </ul>
          <button className="btn-primary">+ Create Campaign</button>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;