import React, { useState } from "react";
import "./Deposit.css";

const Deposit = () => {
  const [search, setSearch] = useState("");

  const deposits = [
    { id: "M4pX************9TqJ", amount: "$10,509", status: "Pending Transaction", updated_at: "24 June 2025 14:00" },
    { id: "L2kH************8VmN", amount: "$36", status: "Checking Deposit", updated_at: "24 June 2025 13:00" },
    { id: "Q7dP************4xRB", amount: "$3,012", status: "Deposit Success", updated_at: "24 June 2025 12:00" },
    { id: "A67z************1YwC", amount: "$7,956", status: "Deposit Failed", updated_at: "24 June 2025 11:00" },
    { id: "T9gL************5UsE", amount: "$1,897", status: "Deposit Success", updated_at: "24 June 2025 10:00" },
    { id: "B3nV************7JoK", amount: "$1,574", status: "Deposit Success", updated_at: "24 June 2025 09:00" },
    { id: "Z8qR************2PlM", amount: "$851", status: "Deposit Success", updated_at: "24 June 2025 08:00" },
    { id: "E5cJ************6KhD", amount: "$1,574", status: "Deposit Success", updated_at: "24 June 2025 07:00" },
    { id: "NiWT************3LyF", amount: "$4,212", status: "Deposit Success", updated_at: "24 June 2025 06:00" },
    { id: "R0yG************7OeP", amount: "$16,387", status: "Deposit Failed", updated_at: "24 June 2025 05:00" }
  ];

  const filteredData = deposits.filter((d) =>
    d.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="deposit-container">
      <div className="deposit-header">
        <h2>Deposit</h2>
        <button className="topup-btn">+ Top Up Credit</button>
      </div>

      <div className="deposit-card">
        <h3>Deposit History</h3>
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search deposit by id deposit.."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select>
            <option>Status</option>
          </select>
          <select>
            <option>Month</option>
          </select>
        </div>

        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>ID Deposit</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Top Up Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((d, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{Math.floor(new Date(d.created_at).getTime() / 1000)}</td>
                <td>{d.amount}</td>
                <td>
                  <span
                    className={`status-badge-depoyus ${d.status
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {d.status}
                  </span>
                </td>
                <td>{d.updated_at}</td>
                <td>
                  <button className="view-btn">👁</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Deposit;
