import React, { useState, useEffect } from "react";
import "../../style/admin/TicketSupport.css";
import TicketSupportTable from "./TicketSupportTable"; // Import komponen tabel tiket
import { fetchApi } from "../../utils/api"; // Import fetchApi untuk mengambil data tiket
import ContactSettingsModal from "./ContactSettingsModal";

const TicketSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(""); // Error state
    const [showSettings, setShowSettings] = useState(false);

  // Fetch tiket saat komponen pertama kali dimuat
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetchApi("/support/tickets");
        setTickets(response);
      } catch (err) {
        setError("Failed to fetch tickets. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  return (
    <div className="dashboard-container">
      <main className="main-content-ticket">
        <section className="ticket-section">
          <div className="ticket-header">
            <h2 className="ticket-title">Ticket Support</h2>
            <button className="btn-settings" onClick={() => setShowSettings(true)}>
              ⚙ Manage Contacts
            </button>
          </div>

          <div className="ticket-card">
            {loading ? (
              <div className="loading-message">Loading tickets...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : tickets.length > 0 ? (
              <TicketSupportTable tickets={tickets} />
            ) : (
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
            )}
          </div>
        </section>
      </main>

      {showSettings && (
        <ContactSettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default TicketSupport;
