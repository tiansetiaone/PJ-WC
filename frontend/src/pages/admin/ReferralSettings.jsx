import React, { useState, useEffect } from "react";
import "../../style/admin/ReferralSettings.css";
import { getAllReferrals, getReferralRoles } from "../../utils/api";
import NewRate from "./NewRate";

export default function ReferralSettings() {
  const [settingsData, setSettingsData] = useState([]);
  const [registeredData, setRegisteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Tambahkan state untuk trigger refresh
  
  // State untuk filter dan search
  const [settingsSearch, setSettingsSearch] = useState("");
  const [settingsFilter, setSettingsFilter] = useState("");
  const [registeredSearch, setRegisteredSearch] = useState("");
  const [registeredFilter, setRegisteredFilter] = useState("");

  // Fungsi format tanggal: DD MONTH YEAR (contoh: 26 August 2025)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) return "Invalid Date";
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  };

  // Fungsi untuk fetch data settings
  const fetchSettingsData = async () => {
    try {
      const roles = await getReferralRoles();
      setSettingsData(
        Array.isArray(roles)
          ? roles.map((role) => ({
              id: role.id,
              type: role.commission_type,
              rate: role.commission_type === "percent" 
                ? `${role.commission_rate * 100}%`
                : `$${role.commission_rate}`,
              date: formatDate(role.updated_at || role.created_at),
              rawDate: new Date(role.updated_at || role.created_at)
            }))
          : []
      );
    } catch (err) {
      console.error("Error fetching referral settings:", err.message);
    }
  };

  // Fungsi untuk fetch data registered
  const fetchRegisteredData = async () => {
    try {
      const referrals = await getAllReferrals();
      setRegisteredData(
        referrals.map((r) => ({
          id: r.id,
          name: r.referred_name,
          email: r.referred_email,
          user: r.referrer_name,
          date: formatDate(r.created_at),
          rawDate: new Date(r.created_at)
        }))
      );
    } catch (err) {
      console.error("Error fetching referrals:", err.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchSettingsData(), fetchRegisteredData()]);
      } catch (err) {
        console.error("Error fetching data:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshTrigger]); // Tambahkan refreshTrigger sebagai dependency

  // Filter settings data - DIPERBAIKI dengan UTC
  const filteredSettings = settingsData.filter(item => {
    // Search filter
    const matchesSearch = settingsSearch === "" || 
      item.rate.toLowerCase().includes(settingsSearch.toLowerCase()) ||
      item.date.toLowerCase().includes(settingsSearch.toLowerCase());
    
    // Time filter - GUNAKAN UTC UNTUK MENGHINDARI TIMEZONE ISSUES
    const now = new Date();
    let matchesFilter = true;
    
    if (settingsFilter === "Month") {
      matchesFilter = 
        item.rawDate.getUTCMonth() === now.getUTCMonth() && 
        item.rawDate.getUTCFullYear() === now.getUTCFullYear();
    } else if (settingsFilter === "Year") {
      matchesFilter = item.rawDate.getUTCFullYear() === now.getUTCFullYear();
    }
    
    return matchesSearch && matchesFilter;
  });

  // Filter registered data - DIPERBAIKI dengan UTC
  const filteredRegistered = registeredData.filter(item => {
    // Search filter
    const matchesSearch = registeredSearch === "" || 
      item.name.toLowerCase().includes(registeredSearch.toLowerCase()) ||
      item.email.toLowerCase().includes(registeredSearch.toLowerCase()) ||
      item.user.toLowerCase().includes(registeredSearch.toLowerCase()) ||
      item.date.toLowerCase().includes(registeredSearch.toLowerCase());
    
    // Time filter - GUNAKAN UTC UNTUK MENGHINDARI TIMEZONE ISSUES
    const now = new Date();
    let matchesFilter = true;
    
    if (registeredFilter === "Month") {
      matchesFilter = 
        item.rawDate.getUTCMonth() === now.getUTCMonth() && 
        item.rawDate.getUTCFullYear() === now.getUTCFullYear();
    } else if (registeredFilter === "Year") {
      matchesFilter = item.rawDate.getUTCFullYear() === now.getUTCFullYear();
    }
    
    return matchesSearch && matchesFilter;
  });

  // Fungsi untuk handle close modal dengan refresh data
  const handleCloseModal = () => {
    setShowModal(false);
    setRefreshTrigger(prev => prev + 1); // Trigger refresh data
  };

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
              <input 
                type="text" 
                placeholder="Search settings history..." 
                value={settingsSearch}
                onChange={(e) => setSettingsSearch(e.target.value)}
              />
              <select
                value={settingsFilter}
                onChange={(e) => setSettingsFilter(e.target.value)}
              >
                <option value="">All Time</option>
                <option value="Month">This Month</option>
                <option value="Year">This Year</option>
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : filteredSettings.length === 0 ? (
          <div className="empty-state">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
              alt="empty"
            />
            <p className="empty-title">
              {settingsSearch || settingsFilter ? "No matching results" : "No Settings History Yet"}
            </p>
            <p className="empty-subtitle">
              {settingsSearch || settingsFilter 
                ? "Try adjusting your search or filter criteria" 
                : "There is no referral commission rate setting recorded yet."}
            </p>
          </div>
        ) : (
          <table className="referral-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Commission Type</th>
                <th>Commission Rate</th>
                <th>Last Update</th>
              </tr>
            </thead>
            <tbody>
              {filteredSettings.map((row, index) => (
                <tr key={row.id}>
                  <td>{index + 1}</td>
                  <td>{row.type}</td>
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
              <input 
                type="text" 
                placeholder="Search referral registered history..." 
                value={registeredSearch}
                onChange={(e) => setRegisteredSearch(e.target.value)}
              />
              <select
                value={registeredFilter}
                onChange={(e) => setRegisteredFilter(e.target.value)}
              >
                <option value="">All Time</option>
                <option value="Month">This Month</option>
                <option value="Year">This Year</option>
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : filteredRegistered.length === 0 ? (
          <div className="empty-state">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
              alt="empty"
            />
            <p className="empty-title">
              {registeredSearch || registeredFilter ? "No matching results" : "No Referral Registered History Yet"}
            </p>
            <p className="empty-subtitle">
              {registeredSearch || registeredFilter 
                ? "Try adjusting your search or filter criteria" 
                : "No users have registered through any referral link yet."}
            </p>
          </div>
        ) : (
          <table className="referral-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Registered Via User's Link</th>
                <th>Registered Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistered.map((row, index) => (
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
            <NewRate onClose={handleCloseModal} /> {/* Gunakan handleCloseModal */}
          </div>
        </div>
      )}
    </div>
  );
}