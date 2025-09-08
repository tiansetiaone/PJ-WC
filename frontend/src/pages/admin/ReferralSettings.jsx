import React, { useState, useEffect } from "react";
import "../../style/admin/ReferralSettings.css";
import {
  getAllReferrals,
  getCommissionSettings,
  setActiveCommissionSetting,
  updateCommissionSetting,
  deleteCommissionSetting,
  getCommissionSettingById
} from "../../utils/api";
import NewRate from "./NewRate";
import EditRate from "./EditRate";

export default function ReferralSettings() {
  const [settingsData, setSettingsData] = useState([]);
  const [registeredData, setRegisteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [error, setError] = useState("");

  // State untuk filter dan search
  const [settingsSearch, setSettingsSearch] = useState("");
  const [settingsFilter, setSettingsFilter] = useState("");
  const [registeredSearch, setRegisteredSearch] = useState("");
  const [registeredFilter, setRegisteredFilter] = useState("");

  // Format tanggal
  const formatDate = (dateString) => {
    if (!dateString) return "Invalid Date";
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";

    const day = date.getDate().toString().padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  };

  // Fetch single setting untuk edit
  const fetchSettingForEdit = async (id) => {
    try {
      const response = await getCommissionSettingById(id);
      setEditingSetting(response.data);
      setShowEditModal(true);
    } catch (err) {
      console.error("Error fetching setting:", err.message);
      setError("Failed to fetch setting details");
    }
  };

  // Handle update commission
  const handleUpdateSetting = async (id, data) => {
    try {
      await updateCommissionSetting(id, data);
      setShowEditModal(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Error updating commission:", err.message);
      setError("Failed to update commission setting");
    }
  };

  // Handle delete commission
  const handleDeleteSetting = async (id) => {
    if (!window.confirm("Are you sure you want to delete this commission setting?")) {
      return;
    }

    try {
      await deleteCommissionSetting(id);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Error deleting commission:", err.message);
      setError("Failed to delete commission setting");
    }
  };

  // Fetch settings
  const fetchSettingsData = async () => {
    try {
      const response = await getCommissionSettings();
      const settings = response.data;
      
      setSettingsData(
        Array.isArray(settings)
          ? settings.map((s) => ({
              id: s.id,
              type: s.commission_type,
              rate:
                s.commission_type === "percent"
                  ? `${s.commission_value * 100}%`
                  : `$${s.commission_value}`,
              minDeposit: s.min_deposit,
              isActive: s.is_active === 1,
              date: formatDate(s.updated_at || s.created_at),
              rawDate: new Date(s.updated_at || s.created_at),
              // Tambahkan field untuk search yang lebih komprehensif
              searchableText: `${s.commission_type} ${s.commission_type === "percent" ? s.commission_value * 100 + "%" : "$" + s.commission_value} ${s.min_deposit} ${formatDate(s.updated_at || s.created_at)}`.toLowerCase()
            }))
          : []
      );
    } catch (err) {
      console.error("Error fetching commission settings:", err.message);
      setError("Failed to fetch commission settings");
    }
  };

  // Fetch registered users
  const fetchRegisteredData = async () => {
    try {
      const response = await getAllReferrals();
      const referrals = response.data;
      
      setRegisteredData(
        Array.isArray(referrals)
          ? referrals.map((r) => ({
              id: r.id,
              name: r.referred_name,
              email: r.referred_email,
              user: r.referrer_name,
              date: formatDate(r.created_at),
              rawDate: new Date(r.created_at),
              // Tambahkan field untuk search yang lebih komprehensif
              searchableText: `${r.referred_name} ${r.referred_email} ${r.referrer_name} ${formatDate(r.created_at)}`.toLowerCase()
            }))
          : []
      );
    } catch (err) {
      console.error("Error fetching referrals:", err.message);
      setError("Failed to fetch referral data");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        await Promise.all([fetchSettingsData(), fetchRegisteredData()]);
      } catch (err) {
        console.error("Error fetching data:", err.message);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshTrigger]);

  // Handle set active commission
  const handleSetActive = async (id) => {
    try {
      await setActiveCommissionSetting(id);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Error setting active commission:", err.message);
      setError("Failed to set active commission");
    }
  };

  // Filter settings - DIPERBAIKI
  const filteredSettings = settingsData.filter((item) => {
    // Search functionality
    const searchTerm = settingsSearch.toLowerCase();
    const matchesSearch = searchTerm === "" || 
      item.type.toLowerCase().includes(searchTerm) ||
      item.rate.toLowerCase().includes(searchTerm) ||
      item.minDeposit.toString().includes(searchTerm) ||
      item.date.toLowerCase().includes(searchTerm) ||
      (item.isActive ? "yes" : "no").includes(searchTerm);

    // Filter functionality berdasarkan waktu
    const now = new Date();
    let matchesFilter = true;

    if (settingsFilter === "Month") {
      matchesFilter = 
        item.rawDate.getMonth() === now.getMonth() &&
        item.rawDate.getFullYear() === now.getFullYear();
    } else if (settingsFilter === "Year") {
      matchesFilter = item.rawDate.getFullYear() === now.getFullYear();
    }

    return matchesSearch && matchesFilter;
  });

  // Filter registered - DIPERBAIKI
  const filteredRegistered = registeredData.filter((item) => {
    // Search functionality
    const searchTerm = registeredSearch.toLowerCase();
    const matchesSearch = searchTerm === "" || 
      item.name.toLowerCase().includes(searchTerm) ||
      item.email.toLowerCase().includes(searchTerm) ||
      item.user.toLowerCase().includes(searchTerm) ||
      item.date.toLowerCase().includes(searchTerm);

    // Filter functionality berdasarkan waktu
    const now = new Date();
    let matchesFilter = true;

    if (registeredFilter === "Month") {
      matchesFilter = 
        item.rawDate.getMonth() === now.getMonth() &&
        item.rawDate.getFullYear() === now.getFullYear();
    } else if (registeredFilter === "Year") {
      matchesFilter = item.rawDate.getFullYear() === now.getFullYear();
    }

    return matchesSearch && matchesFilter;
  });

  const handleCloseModal = () => {
    setShowModal(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  if (error) {
    return (
      <div className="referral-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setRefreshTrigger(prev => prev + 1)}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
          {/* Tampilkan filters meskipun data kosong */}
          <div className="filters">
            <input
              type="text"
              placeholder="Search by type, rate, amount, date..."
              value={settingsSearch}
              onChange={(e) => setSettingsSearch(e.target.value)}
              disabled={loading}
            />
            <select
              value={settingsFilter}
              onChange={(e) => setSettingsFilter(e.target.value)}
              disabled={loading}
            >
              <option value="">All Time</option>
              <option value="Month">This Month</option>
              <option value="Year">This Year</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <p>Loading commission settings...</p>
          </div>
        ) : filteredSettings.length === 0 ? (
          <div className="empty-state">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
              alt="empty"
            />
            <p className="empty-title">
              {settingsSearch || settingsFilter
                ? "No matching results found"
                : "No Settings History Yet"}
            </p>
            <p className="empty-subtitle">
              {settingsSearch || settingsFilter
                ? "Try adjusting your search or filter criteria"
                : "There is no referral commission rate setting recorded yet."}
            </p>
            {(settingsSearch || settingsFilter) && (
              <button 
                className="btn-clear-filters"
                onClick={() => {
                  setSettingsSearch("");
                  setSettingsFilter("");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="results-info">
              {/* <span>
                Showing {filteredSettings.length} of {settingsData.length} settings
                {(settingsSearch || settingsFilter) && " (filtered)"}
              </span> */}
            </div>
            <table className="referral-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Commission Type</th>
                  <th>Commission Rate</th>
                  <th>Min Deposit</th>
                  <th>Active</th>
                  <th>Last Update</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSettings.map((row, index) => (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td>{row.type}</td>
                    <td>{row.rate}</td>
                    <td>${row.minDeposit}</td>
                    <td>
                      <span className={`status-badge ${row.isActive ? 'active' : 'inactive'}`}>
                        {row.isActive ? "Yes" : "No"}
                      </span>
                    </td>
                    <td>{row.date}</td>
                    <td>
                      <div className="action-buttons-referral">
                        {!row.isActive && (
                          <button
                            className="btn-set-active"
                            onClick={() => handleSetActive(row.id)}
                            title="Set as active commission"
                          >
                            Set Active
                          </button>
                        )}
                        <button
                          className="btn-edit"
                          onClick={() => fetchSettingForEdit(row.id)}
                          title="Edit commission setting"
                        >
                          Edit
                        </button>
                        {!row.isActive && (
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteSetting(row.id)}
                            title="Delete commission setting"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Referral Registered History */}
      <div className="referral-card">
        <div className="card-header">
          <h3>Referral Registered History</h3>
          {/* Tampilkan filters meskipun data kosong */}
          <div className="filters">
            <input
              type="text"
              placeholder="Search by name, email, user..."
              value={registeredSearch}
              onChange={(e) => setRegisteredSearch(e.target.value)}
              disabled={loading}
            />
            <select
              value={registeredFilter}
              onChange={(e) => setRegisteredFilter(e.target.value)}
              disabled={loading}
            >
              <option value="">All Time</option>
              <option value="Month">This Month</option>
              <option value="Year">This Year</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <p>Loading referral data...</p>
          </div>
        ) : filteredRegistered.length === 0 ? (
          <div className="empty-state">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
              alt="empty"
            />
            <p className="empty-title">
              {registeredSearch || registeredFilter
                ? "No matching results found"
                : "No Referral Registered History Yet"}
            </p>
            <p className="empty-subtitle">
              {registeredSearch || registeredFilter
                ? "Try adjusting your search or filter criteria"
                : "No users have registered through any referral link yet."}
            </p>
            {(registeredSearch || registeredFilter) && (
              <button 
                className="btn-clear-filters"
                onClick={() => {
                  setRegisteredSearch("");
                  setRegisteredFilter("");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="results-info">
              {/* <span>
                Showing {filteredRegistered.length} of {registeredData.length} referrals
                {(registeredSearch || registeredFilter) && " (filtered)"}
              </span> */}
            </div>
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
          </>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content-refmanage">
            <NewRate onClose={handleCloseModal} />
          </div>
        </div>
      )}
      
      {showEditModal && editingSetting && (
        <div className="modal-overlay">
          <div className="modal-content-refmanage">
            <EditRate 
              setting={editingSetting}
              onUpdate={handleUpdateSetting}
              onClose={() => {
                setShowEditModal(false);
                setEditingSetting(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}