import React from "react";
import "./DepositManagement.css";

export default function DepositManagement() {
  const depositData = [
    { id: 1, user: "Desirae Philips", topup: "$12,000", evidence: "evidence_01.png", status: "Checking Deposit", date: "24 June 2025" },
    { id: 2, user: "Gretchen Culhane", topup: "$43,000", evidence: "transfer_02.png", status: "Deposit Success", date: "24 June 2025" },
    { id: 3, user: "Lincoln Botosh", topup: "$7,000", evidence: "proof_tx_03.png", status: "Deposit Failed", date: "24 June 2025" },
    { id: 4, user: "Ahmad Franci", topup: "$700", evidence: "payment_04.png", status: "Deposit Success", date: "24 June 2025" },
  ];

  const commissionData = [
    { id: 1, user: "Desirae Philips", amount: "$50,000", date: "24 June 2025" },
    { id: 2, user: "Gretchen Culhane", amount: "$1,000", date: "24 June 2025" },
    { id: 3, user: "Lincoln Botosh", amount: "$1,000", date: "24 June 2025" },
    { id: 4, user: "Ahmad Franci", amount: "$2,000", date: "24 June 2025" },
  ];

  return (
    <div className="deposit-container">
      <h2 className="deposit-title">Deposit Management</h2>

      {/* Deposit Requests */}
      <div className="deposit-card">
        <div className="card-header">
          <h3>Deposit Requests</h3>
          <div className="filters">
            <input type="text" placeholder="Search deposit by user's request..." />
            <select>
              <option>Status</option>
              <option>Success</option>
              <option>Failed</option>
              <option>Checking</option>
            </select>
            <select>
              <option>Month</option>
              <option>June</option>
              <option>July</option>
            </select>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>User’s Request</th>
              <th>Top Up</th>
              <th>Evidence</th>
              <th>Status</th>
              <th>Top Up Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {depositData.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.user}</td>
                <td>{item.topup}</td>
                <td><a href="#">{item.evidence}</a></td>
                <td>
                  <span className={`status-badge ${item.status.replace(" ", "-").toLowerCase()}`}>
                    {item.status}
                  </span>
                </td>
                <td>{item.date}</td>
                <td>
                  <button className="action-btn">✔</button>
                  <button className="action-btn danger">✖</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Commission History */}
      <div className="deposit-card">
        <div className="card-header">
          <h3>Converted Commission History</h3>
          <div className="filters">
            <input type="text" placeholder="Search converted commission by user..." />
            <select>
              <option>Month</option>
              <option>June</option>
              <option>July</option>
            </select>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>User</th>
              <th>Amount</th>
              <th>Convert Date</th>
            </tr>
          </thead>
          <tbody>
            {commissionData.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.user}</td>
                <td>{item.amount}</td>
                <td>{item.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
