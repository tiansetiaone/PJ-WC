import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../style/user/Deposit.css";
import { fetchApi } from "../../utils/api";
import TransactionModal from "./TransactionModal";

const Deposit = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalDeposits, setTotalDeposits] = useState(0);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Load list deposit dengan pagination
  useEffect(() => {
    const fetchDeposits = async () => {
      try {
        setLoading(true);
        let endpoint = `/deposits/history?page=${currentPage}&limit=${itemsPerPage}`;
        if (search) endpoint += `&search=${search}`;
        if (statusFilter) endpoint += `&status=${statusFilter}`;
        if (monthFilter) endpoint += `&month=${monthFilter}`;
        
        const res = await fetchApi(endpoint);
        setDeposits(res.data || []);
        setTotalDeposits(res.meta?.total || 0);
      } catch (err) {
        console.error("Fetch deposits error:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDeposits();
  }, [currentPage, itemsPerPage, search, statusFilter, monthFilter]);

  // Handle view detail
  const handleView = async (depositId) => {
    try {
      setDetailLoading(true);
      setDetailError(null);
      setShowModal(true);

      const res = await fetchApi(`/deposits/status/${depositId}`);
      const selected = deposits.find((d) => d.id === depositId);
      setSelectedDeposit({
        ...res.data,
        masked_id: selected?.masked_id || res.data.id,
      });
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

  // Hitung total pages
  const totalPages = Math.ceil(totalDeposits / itemsPerPage);

  // Generate page numbers untuk pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 3) {
        endPage = 4;
      }
      
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3;
      }
      
      if (startPage > 2) {
        pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page !== '...' && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  // Reset to first page ketika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, monthFilter]);

  const filteredData = deposits.filter((d) => {
    const matchesSearch = (d?.masked_id || "")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus = statusFilter
      ? (d?.status || "").toLowerCase().includes(statusFilter.toLowerCase())
      : true;

    const matchesMonth = monthFilter
      ? (() => {
          const date = new Date(d.top_up_date);
          const month = String(date.getMonth() + 1).padStart(2, "0");
          return month === monthFilter;
        })()
      : true;

    return matchesSearch && matchesStatus && matchesMonth;
  });

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
      return <span className="status-badge pending">⏱ Pending Transaction</span>;

    return <span className="status-badge">{statusRaw}</span>;
  };

  // ✅ Navigasi ke halaman top up
  const handleTopUp = () => {
    navigate("/deposits/topup");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const parsed = new Date(dateString);
    if (isNaN(parsed)) return dateString;
    return parsed.toLocaleString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="deposit-container-deposit">
      {/* Header */}
      <header className="deposit-header">
        <h2>Deposit</h2>
        <button className="topup-btn" onClick={handleTopUp}>
          + Top Up Credit
        </button>
      </header>

      {/* Deposit History */}
      <section className="deposit-card-deposit">
        <h3>Deposit History</h3>

        {loading ? (
          <p>Loading...</p>
        ) : deposits.length === 0 ? (
          <div className="empty-state">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
              alt="No history"
            />
            <h4>No Deposit History Yet</h4>
            <p>
              You haven't made any deposits yet. Once you make your first
              deposit, the details will be displayed here.
            </p>
          </div>
        ) : (
          <>
            <div className="search-filter">
              <input
                type="text"
                placeholder="Search deposit by ID.."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="checking">Checking</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
              >
                <option value="">All Months</option>
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>

              {/* Items per page selector */}
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="items-per-page-selector"
              >
                <option value="5">5 per page</option>
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
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
                    <td>{(currentPage - 1) * itemsPerPage + i + 1}</td>
                    <td>{d.masked_id}</td>
                    <td>{d.amount}</td>
                    <td>{renderStatusBadge(d.status)}</td>
                    <td>{formatDate(d.top_up_date)}</td>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <div className="pagination-info">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalDeposits)} of {totalDeposits} entries
                </div>
                
                <div className="pagination-controls">
                  {/* Previous Button */}
                  <button
                    className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </button>

                  {/* Page Numbers */}
                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      className={`pagination-btn pagination-number ${
                        page === currentPage ? 'active' : ''
                      } ${page === '...' ? 'ellipsis' : ''}`}
                      onClick={() => handlePageChange(page)}
                      disabled={page === '...'}
                    >
                      {page}
                    </button>
                  ))}

                  {/* Next Button */}
                  <button
                    className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

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