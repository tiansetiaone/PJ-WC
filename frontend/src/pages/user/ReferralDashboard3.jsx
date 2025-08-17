import React from "react";
import "./ReferralDashboard.css";

export default function ReferralDashboard() {
  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">BLASTERC</div>
        <nav>
          <a href="#" className="nav-item">Dashboard</a>
          <a href="#" className="nav-item">Campaign</a>
          <a href="#" className="nav-item">Deposit</a>
          <a href="#" className="nav-item active">Referral</a>
          <a href="#" className="nav-item">Contact Support</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="top-bar">
          <div className="breadcrumb">Referral</div>
          <div className="user-icon">👤</div>
        </div>

        {/* Success Notification */}
        <div className="notification success">
          ✅ Successfully Converted Earnings
        </div>

        {/* Info Sections */}
        <div className="info-sections">
          <div className="card">
            <h3>Earn with Blasterc</h3>
            <p>
              Invite your friends to Blasterc dashboard, if they sign up,
              you will get commission to be converted to USDT.
            </p>
            <div className="steps">
              <div className="step">
                📩 <br /> <strong>Send Invitation</strong>
                <p>Send your referral link to friends...</p>
              </div>
              <div className="step">
                📝 <br /> <strong>Registration</strong>
                <p>Let your friends sign up...</p>
              </div>
              <div className="step">
                🎉 <br /> <strong>Use Blasterc</strong>
                <p>You get commission...</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Share The Referral Link!</h3>
            <p>Invite your friends to Blasterc...</p>
            <div className="share-buttons">
              <button>💬</button>
              <button>✖</button>
              <button>📘</button>
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
            <span className="stat-value">$50.000</span>
            <p>Current Earnings</p>
          </div>
          <div className="stat-card">
            <span className="stat-value">$0</span>
            <p>Convert Earnings</p>
          </div>
          <div className="stat-card">
            <span className="stat-value">12.475</span>
            <p>Total Visited</p>
          </div>
          <div className="stat-card">
            <span className="stat-value">4.385</span>
            <p>Total Registered</p>
          </div>
        </div>

        {/* Registered Users Table */}
        <div className="card">
          <h3>Registered Users</h3>
          <input type="text" placeholder="Search user by full name or email..." />
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Registered Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>Desirae Philips</td>
                <td>desiraephilips@gmail.com</td>
                <td>24 June 2025</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
