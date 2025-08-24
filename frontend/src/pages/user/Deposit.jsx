import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Import hook navigasi
import "../../style/user/Deposit.css";
import { fetchApi } from "../../utils/api";
import TransactionModal from "./TransactionModal"; // ✅ Import modal

const Deposit = () => {
  const navigate = useNavigate(); // ✅ inisialisasi navigasi
  const [search, setSearch] = useState("");
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Load list deposit
  useEffect(() => {
    const fetchDeposits = async () => {
      try {
        const res = await fetchApi("/deposits/history?limit=20&page=1");
        setDeposits(res.data || []);
      } catch (err) {
        console.error("Fetch deposits error:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDeposits();
  }, []);

  // Handle view detail
  const handleView = async (depositId) => {
    try {
      setDetailLoading(true);
      setDetailError(null);
      setShowModal(true);

      const res = await fetchApi(`/deposits/status/${depositId}`);
      setSelectedDeposit(res.data);
    } catch (err) {
      setDetailError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDeposit(null);
  };

  const filteredData = deposits.filter((d) =>
    (d?.masked_id || "").toLowerCase().includes(search.toLowerCase())
  );

  // ✅ Badge status
const renderStatusBadge = (statusRaw) => {
  const status = (statusRaw || "").toLowerCase();

  if (status.includes("checking"))
    return <span className="status-badge checking">🔍 Checking Deposit</span>;

  if (status.includes("success"))
    return <span className="status-badge success">✔ Deposit Success</span>;

  if (status.includes("fail"))
    return <span className="status-badge failed">✖ Deposit Failed</span>;

  if (status.includes("pending"))
    return (
      <span className="status-badge pending">
        ⏱ Pending Transaction
      </span>
    );

  return <span className="status-badge">{statusRaw}</span>; // fallback
};



  // ✅ Navigasi ke halaman top up
  const handleTopUp = () => {
    navigate("/deposits/topup"); 
    // kalau memang route nya "/deposits/list" tinggal ganti ke situ
  };

  return (
    <div className="deposit-container">
      {/* Header */}
      <header className="deposit-header">
        <h2>Deposit</h2>
        <button className="topup-btn" onClick={handleTopUp}>
          + Top Up Credit
        </button>
      </header>

      {/* Deposit History */}
      <section className="deposit-card">
        <h3>Deposit History</h3>

        {loading ? (
          <p>Loading...</p>
        ) : deposits.length === 0 ? (
          // EMPTY STATE
          <div className="empty-state">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
              alt="No history"
            />
            <h4>No Deposit History Yet</h4>
            <p>
              You haven’t made any deposits yet. Once you make your first
              deposit, the details will be displayed here.
            </p>
          </div>
        ) : (
          // LIST TABLE
          <>
            <div className="search-filter">
              <input
                type="text"
                placeholder="Search deposit by ID.."
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
                  <tr key={d.id}>
                    <td>{i + 1}</td>
                    <td>{d.masked_id}</td>
                    <td>{d.amount}</td>
                    <td>{renderStatusBadge(d.status)}</td>
                    <td>{d.top_up_date}</td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() => handleView(d.id)}
                      >
                        👁
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      {/* ✅ Modal pakai komponen terpisah */}
      <TransactionModal
        show={showModal}
        onClose={closeModal}
        deposit={selectedDeposit}
        loading={detailLoading}
        error={detailError}
      />
    </div>
  );
};

export default Deposit;
