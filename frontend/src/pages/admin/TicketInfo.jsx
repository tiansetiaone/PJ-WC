import React from "react";
import "../../style/admin/TicketInfo.css";

const TicketInfo = ({ email, date, message, onBack, onReplyEmail, onReplyTelegram }) => {
  return (
    <div className="ticketinfo-card">
      <h2 className="ticketinfo-title">Ticket Info</h2>

      <div className="ticketinfo-section">
        <h3 className="ticketinfo-subtitle">Ticket</h3>
        <div className="ticketinfo-row">
          <span>Email</span>
          <span>{email}</span>
        </div>
        <div className="ticketinfo-row">
          <span>Received Date</span>
          <span>{date}</span>
        </div>
      </div>

      <div className="ticketinfo-section">
        <h3 className="ticketinfo-subtitle">Message</h3>
        <p className="ticketinfo-message">{message}</p>
      </div>

      <div className="ticketinfo-actions">
        <button className="btn back" onClick={onBack}>Back</button>
        <button className="btn telegram" onClick={onReplyTelegram}>Reply via Telegram</button>
        <button className="btn email" onClick={onReplyEmail}>Reply via Email</button>
      </div>
    </div>
  );
};

export default TicketInfo;
