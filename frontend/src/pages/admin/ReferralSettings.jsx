import React, { useState, useEffect } from "react";
import "../../style/admin/ReferralSettings.css";
import { getAllReferrals, getReferralRoles } from "../../utils/api";
import NewRate from "./NewRate"; // ⬅️ import komponen modal

export default function ReferralSettings() {
  const [settingsData, setSettingsData] = useState([]);
  const [registeredData, setRegisteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); // ⬅️ state untuk modal

  useEffect(() => {
    const fetchData = async () => {
      try {
        const referrals = await getAllReferrals();
        setRegisteredData(
          referrals.map((r) => ({
            id: r.id,
            name: r.referred_name,
            email: r.referred_email,
            user: r.referrer_name,
            date: new Date(r.created_at).toLocaleDateString(),
          }))
        );

        const roles = await getReferralRoles();
        setSettingsData(
          Array.isArray(roles)
            ? roles.map((role) => ({
                id: role.id,
                rate: `$${role.commission_rate}`,
                date: new Date(role.updated_at || role.created_at).toLocaleDateString(),
              }))
            : []
        );
      } catch (err) {
        console.error("Error fetching referrals/settings:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="referral-container">
      {/* Header */}
      <div className="referral-header">
        <h2>Referral Settings</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Create New Rate
        </button>
      </div>

      {/* Settings History */}
      <div className="referral-card">
        <div className="card-header">
          <h3>Settings History</h3>
          {settingsData.length > 0 && (
            <div className="filters">
              <input type="text" placeholder="Search settings history..." />
              <select>
                <option>Month</option>
                <option>Year</option>
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : settingsData.length === 0 ? (
          <div className="empty-state">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
              alt="empty"
            />
            <p className="empty-title">No Settings History Yet</p>
            <p className="empty-subtitle">
              There is no referral commission rate setting recorded yet.
            </p>
          </div>
        ) : (
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
                <tr key={row.id}>
                  <td>{index + 1}</td>
                  <td>{row.rate}</td>
                  <td>{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Referral Registered History */}
      <div className="referral-card">
        <div className="card-header">
          <h3>Referral Registered History</h3>
          {registeredData.length > 0 && (
            <div className="filters">
              <input type="text" placeholder="Search referral registered history..." />
              <select>
                <option>Month</option>
                <option>Year</option>
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : registeredData.length === 0 ? (
          <div className="empty-state">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
              alt="empty"
            />
            <p className="empty-title">No Referral Registered History Yet</p>
            <p className="empty-subtitle">
              No users have registered through any referral link yet.
            </p>
          </div>
        ) : (
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
                <tr key={row.id}>
                  <td>{index + 1}</td>
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>{row.user}</td>
                  <td>{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content-refmanage">
            <NewRate onClose={() => setShowModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
