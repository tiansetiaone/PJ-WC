import React from "react";
import "./ReferralDashboard.css";

const ReferralDashboard = () => {
  return (
    <div className="referral-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">BLASTERC</div>
        <nav>
          <ul>
            <li>Dashboard</li>
            <li>Campaign</li>
            <li>Deposit</li>
            <li className="active">Referral</li>
            <li>Contact Support</li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <h1>Referral</h1>
          <button className="btn-primary">Convert Earnings</button>
        </header>

        {/* Top Info Cards */}
        <section className="top-section">
          <div className="card earn-with">
            <h2>Earn with Blasterc</h2>
            <p>Invite your friends to Blasterc dashboard...</p>
            <div className="steps">
              <div>Send Invitation</div>
              <div>Registration</div>
              <div>Use Blasterc</div>
            </div>
          </div>

          <div className="card share-link">
            <h2>Share The Referral Link!</h2>
            <input type="text" value="blasterc.id/invite/referral-code-XYZ789" readOnly />
            <button className="btn-secondary">Copy Link</button>
          </div>
        </section>

        {/* Stats */}
        <section className="stats">
          <div className="stat-card">
            <h3>Current Earnings</h3>
            <p>$50,000</p>
          </div>
          <div className="stat-card">
            <h3>Convert Earnings</h3>
            <p>$0</p>
          </div>
          <div className="stat-card">
            <h3>Total Visited</h3>
            <p>12,475</p>
          </div>
          <div className="stat-card">
            <h3>Total Registered</h3>
            <p>4,385</p>
          </div>
        </section>

        {/* Registered Users */}
        <section className="table-section">
          <h2>Registered Users</h2>
          <input type="text" placeholder="Search user..." />
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
        </section>

        {/* Converted Earnings */}
        <section className="table-section">
          <h2>Converted Earnings History</h2>
          <input type="text" placeholder="Search user..." />
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Amount</th>
                <th>Convert Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>$50,000</td>
                <td>24 June 2025</td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};

export default ReferralDashboard;
