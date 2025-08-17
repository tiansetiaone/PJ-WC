import React, { useState } from "react";
import "./campaign-management.css";

export default function CampaignManagement() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");

  const campaigns = [
    { id: 1, name: "BLACK FRIDAY!", user: "Desirae Philips", numbers: "200 numbers", status: "Checking Campaign", date: "24 June 2025" },
    { id: 2, name: "Spring Sale Blast", user: "Gretchen Culhane", numbers: "2.000 numbers", status: "Campaign Success", date: "24 June 2025" },
    { id: 3, name: "New Product Launch", user: "Lincoln Botosh", numbers: "15.000 numbers", status: "Campaign Failed", date: "24 June 2025" },
    { id: 4, name: "Holiday Greetings", user: "Ahmad Franci", numbers: "1.000 numbers", status: "Campaign Success", date: "24 June 2025" },
    { id: 5, name: "Customer Feedback Request", user: "Maria Rosser", numbers: "1.400 numbers", status: "Campaign Success", date: "24 June 2025" },
    { id: 6, name: "Special Member Offer", user: "Haylie Rosser", numbers: "800 numbers", status: "Campaign Success", date: "24 June 2025" },
    { id: 7, name: "Year-End Promo", user: "Maren Torff", numbers: "14.000 numbers", status: "Campaign Success", date: "24 June 2025" },
    { id: 8, name: "Flash Deal Alert", user: "Allison Curtis", numbers: "20.000 numbers", status: "Campaign Success", date: "24 June 2025" },
    { id: 9, name: "Service Update Notice", user: "Tiana Dokidis", numbers: "80 numbers", status: "Campaign Success", date: "24 June 2025" },
    { id: 10, name: "Anniversary Thank You", user: "Carla Lipshutz", numbers: "100 numbers", status: "Campaign Success", date: "24 June 2025" },
  ];

  return (
    <div className="cm-container">
      <div className="cm-header">
        <h2>Campaign Management</h2>
        <nav className="cm-breadcrumb">
          <span>Campaign Management</span>
        </nav>
      </div>

      <div className="cm-box">
        <h3 className="cm-subtitle">Campaign Requests</h3>
        <div className="cm-toolbar">
          <input
            type="text"
            className="cm-search"
            placeholder="Search campaign by campaign name or user's request.."
          />
          <select
            className="cm-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>Status</option>
            <option>All</option>
            <option>Checking Campaign</option>
            <option>Campaign Success</option>
            <option>Campaign Failed</option>
          </select>
          <select
            className="cm-select"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            <option>Month</option>
            <option>June</option>
            <option>July</option>
          </select>
        </div>

        <table className="cm-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Campaign Name</th>
              <th>User's Request</th>
              <th>Sum. Number</th>
              <th>Status</th>
              <th>Register Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.name}</td>
                <td>{c.user}</td>
                <td>{c.numbers}</td>
                <td>
                  <span
                    className={`cm-status ${
                      c.status === "Checking Campaign"
                        ? "checking"
                        : c.status === "Campaign Success"
                        ? "success"
                        : "failed"
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                <td>{c.date}</td>
                <td className="cm-action">
                  <button className="cm-eye">👁</button>
                  <button className="cm-check">✔</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="cm-footer">
          <p>10 of 4,201 data</p>
          <div className="cm-pagination">
            <button className="page active">1</button>
            <button className="page">2</button>
            <button className="page">3</button>
            <span>...</span>
            <button className="page">421</button>
          </div>
        </div>
      </div>
    </div>
  );
}
