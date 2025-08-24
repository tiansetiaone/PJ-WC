import React, { useEffect, useState } from "react";
import "../../style/admin/DepositManagement.css";
import { fetchApi } from "../../utils/api";
import TransactionDetail from "./TransactionDetail"; // pastikan path sesuai


export default function DepositManagement() {
  const [depositData, setDepositData] = useState([]);
  const [commissionData, setCommissionData] = useState([]);
  const [loadingDeposits, setLoadingDeposits] = useState(false);
  const [loadingCommissions, setLoadingCommissions] = useState(false);
  const [searchDeposit, setSearchDeposit] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [showModal, setShowModal] = useState(false);
const [selectedDeposit, setSelectedDeposit] = useState(null);


// Fungsi buka modal
const handleViewDeposit = (deposit) => {
  console.log("Deposit clicked:", deposit); // debug
  setSelectedDeposit(deposit);
  setShowModal(true);
};


// Fungsi tutup modal
const closeModal = () => {
  setShowModal(false);
  setSelectedDeposit(null);
};


  // Ambil data deposit (Admin view)
  const getDepositRequests = async () => {
    try {
      setLoadingDeposits(true);
      let endpoint = `/deposits/admin/requests?limit=50`;
      if (searchDeposit) endpoint += `&search=${searchDeposit}`;
      if (filterStatus) endpoint += `&status=${filterStatus}`;
      const res = await fetchApi(endpoint);
      setDepositData(res.data);
    } catch (err) {
      console.error("Error fetching deposits:", err.message);
    } finally {
      setLoadingDeposits(false);
    }
  };

  // Ambil data converted commission (Admin view)
  const getCommissionHistory = async () => {
    try {
      setLoadingCommissions(true);
      const res = await fetchApi("/admin/commission/history"); // asumsi endpoint
      setCommissionData(res.data || []);
    } catch (err) {
      console.error("Error fetching commission history:", err.message);
    } finally {
      setLoadingCommissions(false);
    }
  };

  useEffect(() => {
    getDepositRequests();
    getCommissionHistory();
  }, [searchDeposit, filterStatus, filterMonth]);

  // Approve / Reject deposit
  const handleProcessDeposit = async (deposit_id, action) => {
    const confirmMsg = `Are you sure you want to ${action} this deposit?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await fetchApi("/deposits/admin/process", {
        method: "POST",
        body: { deposit_id, action },
      });
      alert(`Deposit ${action} successfully`);
      getDepositRequests(); // refresh list
    } catch (err) {
      alert("Failed to process deposit: " + err.message);
    }
  };

  return (
    <div className="deposit-container">
      <h2 className="deposit-title">Deposit Management</h2>

      {/* Deposit Requests */}
      <div className="deposit-card">
        <div className="card-header">
          <h3>Deposit Requests</h3>
          {depositData.length > 0 && (
            <div className="filters">
              <input
                type="text"
                placeholder="Search deposit by user's request..."
                value={searchDeposit}
                onChange={(e) => setSearchDeposit(e.target.value)}
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Status</option>
                <option value="approved">Success</option>
                <option value="rejected">Failed</option>
                <option value="checking">Checking</option>
              </select>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                <option value="">Month</option>
                <option value="June">June</option>
                <option value="July">July</option>
              </select>
            </div>
          )}
        </div>

        {loadingDeposits ? (
          <p>Loading deposits...</p>
        ) : depositData.length === 0 ? (
          <div className="card-content">
            <img
              src="https://via.placeholder.com/120x120.png?text=No+Data"
              alt="No Deposit"
              className="card-image"
            />
            <h4 className="empty-title">No Deposit Requests Yet</h4>
            <p className="empty-text">
              There are no deposit requests at the moment. Any new requests
              from users will appear here for your review.
            </p>
          </div>
        ) : (
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
                  <td>{item.user_request}</td>
                  <td>{item.top_up}</td>
                  <td>
                    {item.evidence ? (
                      <a href={item.evidence} target="_blank" rel="noreferrer">
                        {item.evidence.split("/").pop()}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${item.status
                        .replace(" ", "-")
                        .toLowerCase()}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td>{item.top_up_date}</td>
<td>
  <button
    className="action-btn-view"
    onClick={() => handleViewDeposit(item)}
  >
    👁
  </button>
  {item.status === "Checking Deposit" && (
    <>
      <button
        className="action-btn"
        onClick={() => handleProcessDeposit(item.id, "approve")}
      >
        ✔
      </button>
      <button
        className="action-btn danger"
        onClick={() => handleProcessDeposit(item.id, "reject")}
      >
        ✖
      </button>
    </>
  )}
</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Converted Commission History */}
      <div className="deposit-card">
        <div className="card-header">
          <h3>Converted Commission History</h3>
        </div>

        {loadingCommissions ? (
          <p>Loading commission history...</p>
        ) : commissionData.length === 0 ? (
          <div className="card-content">
            <img
              src="https://via.placeholder.com/120x120.png?text=No+Data"
              alt="No Commission"
              className="card-image"
            />
            <h4 className="empty-title">No Converted Commission History Yet</h4>
            <p className="empty-text">
              You haven't converted any commissions yet. Once you do, your
              history will appear here for easy tracking and review.
            </p>
          </div>
        ) : (
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
        )}
      </div>
{showModal && selectedDeposit && (
  <TransactionDetail 
    deposit={selectedDeposit} 
    onClose={closeModal} 
    onProcess={handleProcessDeposit} 
  />
)}
    </div>
  );
}
