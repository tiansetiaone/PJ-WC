import React, { useState } from "react";
import "./ReferralSettings.css";

export default function ReferralSettings() {
  const [activePageSettings, setActivePageSettings] = useState(1);
  const [activePageRegistered, setActivePageRegistered] = useState(1);

  // Dummy data settings
  const settingsData = [
    { rate: "$0.5", date: "24 June 2025" },
    { rate: "$0.4", date: "24 June 2025" },
    { rate: "$0.3", date: "24 June 2025" },
    { rate: "$0.2", date: "24 June 2025" },
    { rate: "$0.1", date: "24 June 2025" },
    { rate: "$1", date: "24 June 2025" },
    { rate: "$1.5", date: "24 June 2025" },
    { rate: "$1.2", date: "24 June 2025" },
    { rate: "$1.25", date: "24 June 2025" },
    { rate: "$0.8", date: "24 June 2025" },
  ];

  // Dummy data registered
  const registeredData = [
    { name: "Desirae Philips", email: "desiraephilips@gmail.com", user: "Tio Ramdan", date: "24 June 2025" },
    { name: "Gretchen Culhane", email: "gretchenculhane@gmail.com", user: "Tio Ramdan", date: "24 June 2025" },
    { name: "Lincoln Botosh", email: "lincolnbotosh@gmail.com", user: "Tio Ramdan", date: "24 June 2025" },
    { name: "Ahmad Franci", email: "ahmadfranci@gmail.com", user: "Tio Ramdan", date: "24 June 2025" },
    { name: "Maria Rosser", email: "mariarosser@gmail.com", user: "Tio Ramdan", date: "24 June 2025" },
    { name: "Haylie Rosser", email: "haylierosser@gmail.com", user: "Tio Ramdan", date: "24 June 2025" },
    { name: "Maren Torff", email: "marentorff@gmail.com", user: "Tio Ramdan", date: "24 June 2025" },
    { name: "Allison Curtis", email: "allisoncurtis@gmail.com", user: "Tio Ramdan", date: "24 June 2025" },
    { name: "Tiana Dokkidis", email: "tianadokkidis@gmail.com", user: "Tio Ramdan", date: "24 June 2025" },
    { name: "Carla Lipshutz", email: "carlalipshutz@gmail.com", user: "Tio Ramdan", date: "24 June 2025" },
  ];

  return (
    <div className="referral-container">
      {/* Header */}
      <div className="referral-header">
        <h2>Referral Settings</h2>
        <button className="btn-primary">+ Create New Rate</button>
      </div>

      {/* Settings History */}
      <div className="referral-card">
        <div className="card-header">
          <h3>Settings History</h3>
          <div className="filters">
            <input type="text" placeholder="Search settings history by commission rate.." />
            <select>
              <option>Month</option>
              <option>Year</option>
            </select>
          </div>
        </div>
        <table className="referral-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Commission Rate</th>
              <th>Last Update</th>
            </tr>
          </thead>
          <tbody>
            {settingsData.map((row, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{row.rate}</td>
                <td>{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <span>10 of 13 data</span>
          <div>
            <button>&lt;</button>
            <button className="active">1</button>
            <button>2</button>
            <button>3</button>
            <span>...</span>
            <button>10</button>
            <button>&gt;</button>
          </div>
        </div>
      </div>

      {/* Referral Registered History */}
      <div className="referral-card">
        <div className="card-header">
          <h3>Referral Registered History</h3>
          <div className="filters">
            <input type="text" placeholder="Search referral registered history by full name, email, or registered via user’s link.." />
            <select>
              <option>Month</option>
              <option>Year</option>
            </select>
          </div>
        </div>
        <table className="referral-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Registered Via User’s Link</th>
              <th>Registered Date</th>
            </tr>
          </thead>
          <tbody>
            {registeredData.map((row, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{row.name}</td>
                <td>{row.email}</td>
                <td>{row.user}</td>
                <td>{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <span>10 of 479 data</span>
          <div>
            <button>&lt;</button>
            <button className="active">1</button>
            <button>2</button>
            <button>3</button>
            <span>...</span>
            <button>48</button>
            <button>&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
}
