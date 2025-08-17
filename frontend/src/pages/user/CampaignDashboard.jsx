import React from "react";
import "./campaignDashboard.css";

export default function CampaignDashboard() {
  const stats = [
    { label: "Total", value: 255, color: "blue", icon: "🏴" },
    { label: "Checking", value: 3, color: "orange", icon: "🔍" },
    { label: "Success", value: 240, color: "green", icon: "✅" },
    { label: "Failed", value: 12, color: "red", icon: "❌" }
  ];

  const campaigns = [
    { id: "M4pX", name: "BLACK FRIDAY!", channel: "WhatsApp", status: "Checking", date: "24 June 2025 14:00" },
    { id: "L2kH", name: "Spring Sale Blast", channel: "WhatsApp", status: "Checking", date: "24 June 2025 13:00" },
    { id: "Q7pD", name: "New Product Launch", channel: "WhatsApp", status: "Success", date: "24 June 2025 12:00" },
    { id: "A6fZ", name: "Holiday Greetings", channel: "WhatsApp", status: "Failed", date: "24 June 2025 11:00" },
  ];

  return (
    <div className="cd-root">
      <aside className="cd-sidebar">
        <div className="cd-logo">BLASTERC</div>
        <nav className="cd-nav">
          <a>Dashboard</a>
          <a className="active">Campaign</a>
          <a>Deposit</a>
          <a>Referral</a>
          <a>Contact Support</a>
        </nav>
      </aside>

      <main className="cd-main">
        <header className="cd-header">
          <h1>Campaign</h1>
          <button className="cd-btn-primary">+ Create New Campaign</button>
        </header>

        {/* Stats */}
        <div className="cd-stats">
          {stats.map((s) => (
            <div key={s.label} className={`cd-stat cd-${s.color}`}>
              <div className="cd-stat-icon">{s.icon}</div>
              <div className="cd-stat-value">{s.value}</div>
              <div className="cd-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Chart placeholder */}
        <div className="cd-card">
          <h3>Campaign Analytics</h3>
          <div className="cd-chart-placeholder">[Chart Here]</div>
        </div>

        {/* Campaign list */}
        <div className="cd-card">
          <h3>Campaign Activity</h3>
          <input
            type="text"
            placeholder="Search campaign by name or ID..."
            className="cd-search"
          />
          <table className="cd-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>ID Campaign</th>
                <th>Campaign Name</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Campaign Date</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, idx) => (
                <tr key={c.id}>
                  <td>{idx + 1}</td>
                  <td>{c.id}********</td>
                  <td>{c.name}</td>
                  <td>{c.channel}</td>
                  <td>
                    <span className={`cd-status cd-${c.status.toLowerCase()}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>{c.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
