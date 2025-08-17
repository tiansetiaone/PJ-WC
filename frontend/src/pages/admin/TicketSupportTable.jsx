import React from "react";
import "./TicketSupportTable.css";

const TicketSupportTable = () => {
  const tickets = [
    {
      id: 1,
      email: "desiarep@gmail.com",
      message:
        "I’ve been trying to log in but keep getting an error saying my credentials...",
      date: "24 June 2025",
    },
    {
      id: 2,
      email: "gretchenc@gmail.com",
      message:
        "I made a deposit yesterday but it hasn’t appeared in my balance yet. Co...",
      date: "24 June 2025",
    },
    {
      id: 3,
      email: "lincolnb@gmail.com",
      message:
        "I noticed that my referral commission rate seems lower than expected...",
      date: "24 June 2025",
    },
    {
      id: 4,
      email: "ahmadfranci@gmail.com",
      message:
        "I attempted to launch a campaign today but the system displayed an un...",
      date: "24 June 2025",
    },
    {
      id: 5,
      email: "mariarosser@gmail.com",
      message:
        "When I try to update my profile details, the page keeps reloading withou...",
      date: "24 June 2025",
    },
  ];

  return (
    <div className="ticket-container">
      <h2 className="ticket-title">Ticket Support</h2>

      <div className="ticket-card">
        <h3 className="ticket-subtitle">Ticket Requests</h3>

        {/* Search & Filter */}
        <div className="ticket-toolbar">
          <input
            type="text"
            className="ticket-search"
            placeholder="Search referral registered history by full name, email, or registed via user's link.."
          />
          <select className="ticket-filter">
            <option>Month</option>
            <option>June</option>
            <option>May</option>
            <option>April</option>
          </select>
        </div>

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
                <td>{ticket.email}</td>
                <td>{ticket.message}</td>
                <td>{ticket.date}</td>
                <td className="ticket-action">
                  <button className="icon-btn">✉️</button>
                  <button className="icon-btn">📤</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="ticket-footer">
          <span>10 of 11 data</span>
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
