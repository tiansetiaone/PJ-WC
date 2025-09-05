import React, { useState } from "react";
import "../../style/admin/TicketSupportTable.css";
import { sendEmailResponse, sendTelegramResponse } from "../../utils/api"; // Pastikan fungsi ini ada di utils/api.js

const TicketSupportTable = ({ tickets }) => {
  // Fungsi untuk mengirim balasan lewat email
const handleSendEmail = async (ticketId, email) => {
  const responseMessage = "Your issue has been resolved"; // Pesan balasan
  try {
    // Kirim email
    await sendEmailResponse(ticketId, responseMessage); 
    alert("Balasan telah dikirim lewat email ke: " + email);
  } catch (error) {
    alert("Gagal mengirim balasan lewat email");
  }
};


  // Fungsi untuk mengirim balasan lewat Telegram
  const handleSendTelegram = async (ticketId, phoneNumber) => {
    const responseMessage = "Your issue has been resolved"; // Pesan balasan
    try {
      await sendTelegramResponse(ticketId, phoneNumber, responseMessage); // Mengirim balasan lewat API
      alert("Balasan telah dikirim lewat Telegram ke: " + phoneNumber);
    } catch (error) {
      alert("Gagal mengirim balasan lewat Telegram");
    }
  };

  return (
    <div className="ticket-container">
      <div className="ticket-card">
        <h3 className="ticket-subtitle">Ticket Requests</h3>

        {/* Table */}
        <table className="ticket-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Email</th>
              <th>Message</th>
              <th>Received Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket, index) => (
              <tr key={ticket.id}>
                <td>{index + 1}</td>
                <td>{ticket.user_email}</td>
                <td>{ticket.subject}</td>
                <td>{new Date(ticket.created_at).toLocaleDateString()}</td>
                <td className="ticket-action">
                  {/* Action buttons */}
                  <button
                    className="icon-btn"
                    onClick={() => handleSendEmail(ticket.id, ticket.user_email)}
                  >
                    ✉️ Kirim Balasan Lewat Email
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() =>
                      handleSendTelegram(ticket.id, ticket.user_whatsapp_number)
                    }
                  >
                    📤 Kirim Balasan Lewat Telegram
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="ticket-footer">
          <span>{tickets.length} data</span>
          <div className="pagination">
            <button className="page-btn">{"<"}</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">{">"}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketSupportTable;
