import React from "react";
import "./TicketSupport.css";

const TicketSupport = () => {
  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">BLASTERC</div>
        <nav className="menu">
          <a href="#" className="menu-item">Dashboard</a>
          <a href="#" className="menu-item">User Management</a>
          <a href="#" className="menu-item">Campaign Management</a>
          <a href="#" className="menu-item">Deposit Management</a>
          <a href="#" className="menu-item">Referral Settings</a>
          <a href="#" className="menu-item">Notification Management</a>
          <a href="#" className="menu-item active">Ticket Support</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div className="breadcrumb">Ticket Support</div>
          <div className="profile">
            <span className="notif-icon">🔔</span>
            <span className="avatar">AD</span>
          </div>
        </header>

        <section className="ticket-section">
          <h2 className="ticket-title">Ticket Support</h2>
          <div className="ticket-card">
            <h3 className="ticket-subtitle">Ticket Requests</h3>
            <div className="ticket-empty">
              <img
                src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
                alt="ticket illustration"
                className="ticket-img"
              />
              <p className="ticket-empty-title">No Ticket Requests Yet</p>
              <p className="ticket-empty-desc">
                Track and measure the performance of your campaigns here. Review
                delivery rates, engagement, and results to optimize your next
                campaign.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TicketSupport;
