import React from "react";
import "./Deposit.css";

const Deposit = () => {
  return (
    <div className="deposit-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">BLASTERC</div>
        <nav>
          <ul>
            <li>Dashboard</li>
            <li>Campaign</li>
            <li className="active">Deposit</li>
            <li>Referral</li>
            <li>Contact Support</li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="header">
          <h2>Deposit</h2>
          <button className="topup-btn">+ Top Up Credit</button>
        </header>

        {/* Deposit History */}
        <section className="deposit-history">
          <h3>Deposit History</h3>
          <div className="empty-state">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
              alt="No history"
            />
            <h4>No Deposit History Yet</h4>
            <p>
              You haven’t made any deposits yet. Once you make your first
              deposit, the details will be displayed here.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Deposit;
