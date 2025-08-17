import React from "react";
import "./campaign.css";

export default function CampaignPage() {
  const stats = [
    { label: "Total", value: 0, icon: "▶" },
    { label: "Checking", value: 0, icon: "🔍" },
    { label: "Success", value: 0, icon: "✅" },
    { label: "Failed", value: 0, icon: "❌" },
  ];

  return (
    <div className="cb-root">
      <aside className="cb-sidebar">
        <div className="cb-logo">BLASTERC</div>
        <nav className="cb-nav">
          <a className="active">Dashboard</a>
          <a className="active">Campaign</a>
          <a>Deposit</a>
          <a>Referral</a>
          <a>Contact Support</a>
        </nav>
      </aside>

      <main className="cb-main">
        <header className="cb-header">
          <h1>Campaign</h1>
          <button className="cb-btn-primary">+ Create New Campaign</button>
        </header>

        <section className="cb-cards">
          <div className="cb-card stats">
            {stats.map((s) => (
              <div key={s.label} className="stat-item">
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-body">
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="cb-card analytics">
            <div className="placeholder-illustration">📊</div>
            <h3>No Campaign Analytics Yet</h3>
            <p>Track and measure the performance of your campaigns here. Review delivery rates, engagement, and results to optimize your next campaign.</p>
          </div>

          <div className="cb-card activity">
            <div className="placeholder-illustration">📝</div>
            <h3>No Campaign Activity Yet</h3>
            <p>You haven't created or run any campaigns yet. Start your first campaign to reach your audience and track the results here.</p>
          </div>
        </section>
      </main>
    </div>
  );
}