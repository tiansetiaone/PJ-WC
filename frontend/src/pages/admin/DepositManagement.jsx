import React, { useEffect, useState } from "react";
import "../../style/admin/DepositManagement.css";
import { fetchApi } from "../../utils/api";
import TransactionDetail from "./TransactionDetail";
import { useNavigate } from "react-router-dom";

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
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [adminWallets, setAdminWallets] = useState([]);
  const [newWallet, setNewWallet] = useState({ network: "TRC20", address: "" });
  const navigate = useNavigate();
  const [monthOptions, setMonthOptions] = useState([]);
  const [searchCommission, setSearchCommission] = useState("");
  const [filterCommissionStatus, setFilterCommissionStatus] = useState("");
  const [filterCommissionMonth, setFilterCommissionMonth] = useState("");
  const [commissionMonthOptions, setCommissionMonthOptions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalDeposits, setTotalDeposits] = useState(0);
    const [showScrollUp, setShowScrollUp] = useState(false);
const [showScrollDown, setShowScrollDown] = useState(false);


// Fungsi untuk check scroll position seluruh modal
const checkModalScrollPosition = () => {
  const container = document.querySelector('.wallet-modal-content');
  if (container) {
    setShowScrollUp(container.scrollTop > 0);
    setShowScrollDown(container.scrollTop < container.scrollHeight - container.clientHeight - 10);
  }
};

// useEffect untuk scroll event listener seluruh modal
useEffect(() => {
  const container = document.querySelector('.wallet-modal-content');
  if (container && showWalletModal) {
    container.addEventListener('scroll', checkModalScrollPosition);
    // Initial check
    checkModalScrollPosition();
    
    return () => {
      container.removeEventListener('scroll', checkModalScrollPosition);
    };
  }
}, [showWalletModal, adminWallets]);

  // Available networks
  const availableNetworks = [
    { value: "TRC20", label: "USDT-TRC20" },
    { value: "ERC20", label: "USDT-ERC20" },
    { value: "BEP20", label: "USDT-BEP20" }
  ];

  // Fungsi buka modal
  const handleViewDeposit = async (deposit) => {
    try {
      // Panggil endpoint detail untuk mendapatkan data lengkap
      const res = await fetchApi(`/deposits/admin/details/${deposit.id}`);
      setSelectedDeposit(res.data);
      setShowModal(true);
    } catch (err) {
      console.error("Error fetching deposit details:", err.message);
      alert("Failed to load deposit details");
    }
  };

  // Fungsi tutup modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedDeposit(null);
  };

  // helper: format tanggal ke Bulan Tahun
  const formatMonthYear = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  // Ambil data deposit (Admin view) dengan pagination
const getDepositRequests = async () => {
  try {
    setLoadingDeposits(true);
    let endpoint = `/deposits/admin/requests?page=${currentPage}&limit=${itemsPerPage}`;
    if (searchDeposit) endpoint += `&search=${searchDeposit}`;
    if (filterStatus) endpoint += `&status=${filterStatus}`;
    if (filterMonth) endpoint += `&month=${filterMonth}`;
    
    const res = await fetchApi(endpoint);

    setDepositData(res.data);
    setTotalDeposits(res.meta?.total || 0);

    // update daftar bulan dari data API
    if (res.data.length > 0) {
      const months = Array.from(
        new Set(res.data.map((item) => formatMonthYear(item.top_up_date)))
      );
      setMonthOptions(months);
    }
  } catch (err) {
    console.error("Error fetching deposits:", err.message);
  } finally {
    setLoadingDeposits(false);
  }
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
    // Always show first page
    pages.push(1);
    
    // Calculate start and end of visible pages
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Adjust if we're near the beginning
    if (currentPage <= 3) {
      endPage = 4;
    }
    
    // Adjust if we're near the end
    if (currentPage >= totalPages - 2) {
      startPage = totalPages - 3;
    }
    
    // Add ellipsis if needed
    if (startPage > 2) {
      pages.push('...');
    }
    
    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add ellipsis if needed
    if (endPage < totalPages - 1) {
      pages.push('...');
    }
    
    // Always show last page
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
  setCurrentPage(1); // Reset to first page when changing items per page
};

// Reset to first page ketika filter berubah
useEffect(() => {
  setCurrentPage(1);
}, [searchDeposit, filterStatus, filterMonth]);

// Panggil API ketika page atau items per page berubah
useEffect(() => {
  getDepositRequests();
}, [currentPage, itemsPerPage, searchDeposit, filterStatus, filterMonth]);

  // Ambil data admin wallets
  const getAdminWallets = async () => {
    try {
      const res = await fetchApi("/deposits/admin/wallets");
      setAdminWallets(res.data || []);
    } catch (err) {
      console.error("Error fetching admin wallets:", err.message);
    }
  };

  // Tambah wallet admin baru
  const addAdminWallet = async () => {
    try {
      if (!newWallet.address.trim()) {
        alert("Please enter wallet address");
        return;
      }

      const res = await fetchApi("/deposits/admin/wallets", {
        method: "POST",
        body: newWallet
      });

      if (res.success) {
        setNewWallet({ network: "TRC20", address: "" });
        getAdminWallets(); // Refresh list
        alert("Wallet added successfully!");
      }
    } catch (err) {
      console.error("Error adding wallet:", err.message);
      alert("Failed to add wallet");
    }
  };

  // Hapus wallet admin
  const deleteAdminWallet = async (walletId) => {
    if (!window.confirm("Are you sure you want to delete this wallet?")) return;

    try {
      const res = await fetchApi(`/deposits/admin/wallets/${walletId}`, {
        method: "DELETE"
      });

      if (res.success) {
        getAdminWallets(); // Refresh list
        alert("Wallet deleted successfully!");
      }
    } catch (err) {
      console.error("Error deleting wallet:", err.message);
      alert("Failed to delete wallet");
    }
  };

  // Ambil data converted commission (Admin view)
  const getCommissionHistory = async () => {
    try {
      setLoadingCommissions(true);
      const res = await fetchApi("/deposits/admin/commission/history");
      const data = res.data || [];
      setCommissionData(data);

      if (data.length > 0) {
        const months = Array.from(
          new Set(data.map((item) => formatMonthYear(item.date)))
        );
        setCommissionMonthOptions(months);
      }
    } catch (err) {
      console.error("Error fetching commission history:", err.message);
    } finally {
      setLoadingCommissions(false);
    }
  };

  const filteredCommissionData = commissionData.filter((item) => {
    const matchesSearch = item.user
      .toLowerCase()
      .includes(searchCommission.toLowerCase());
    const matchesStatus = filterCommissionStatus
      ? item.status?.toLowerCase() === filterCommissionStatus.toLowerCase()
      : true;
    const matchesMonth = filterCommissionMonth
      ? formatMonthYear(item.date) === filterCommissionMonth
      : true;
    return matchesSearch && matchesStatus && matchesMonth;
  });

  useEffect(() => {
    getDepositRequests();
    getCommissionHistory();
    getAdminWallets(); // Load admin wallets
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
      getCommissionHistory(); // refresh commission history jika perlu
    } catch (err) {
      alert("Failed to process deposit: " + err.message);
    }
  };


  // Set default wallet untuk network tertentu
const handleSetDefaultWallet = async (network, walletId) => {
  try {
    const res = await fetchApi("/deposits/admin/wallets/set-default", {
      method: "POST",
      body: { network, wallet_id: walletId }
    });

    if (res.success) {
      getAdminWallets(); // Refresh list
      alert("Default wallet updated successfully!");
    }
  } catch (err) {
    console.error("Error setting default wallet:", err.message);
    alert("Failed to set default wallet");
  }
};

  const handleCreateAmount = () => {
    navigate("/admin/create/amount");
  };


// Fungsi untuk menghapus deposit
const handleDeleteDeposit = async (depositId) => {
  if (!window.confirm("Are you sure you want to delete this deposit? This action cannot be undone.")) return;

  try {
    const response = await fetchApi(`/deposits/admin/delete/${depositId}`, {
      method: "DELETE"
    });
    
    if (response.success) {
      alert("Deposit deleted successfully");
      // Refresh the list
      getDepositRequests();
    } else {
      alert(response.error || "Failed to delete deposit");
    }
  } catch (err) {
    console.error("Delete deposit error:", err);
    alert("Error deleting deposit");
  }
};


  return (
    <div className="deposit-container-depman">
      {/* Header */}
      <div className="notification-header-deposit">
        <h2 className="deposit-title">Deposit Management</h2>
        <div className="header-buttons">
          <button 
            className="btn-wallet"
            onClick={() => setShowWalletModal(true)}
          >
            Edit Data Wallet
          </button>
          <button className="btn-create" onClick={handleCreateAmount}>
            + Create New Amount
          </button>
        </div>
      </div>


      {showWalletModal && (
  <div className="modal-overlay">
    <div className="modal-content-depomanage wallet-modal">
      <button className="modal-close" onClick={() => setShowWalletModal(false)}>
        ×
      </button>
      
      {/* Scroll buttons untuk seluruh modal */}
      {/* <div className="modal-scroll-buttons">
        <button 
          className="scroll-btn scroll-up"
          onClick={() => document.querySelector('.wallet-modal-content').scrollBy({ top: -200, behavior: 'smooth' })}
        >
          ↑ Scroll Up
        </button>
        <button 
          className="scroll-btn scroll-down"
          onClick={() => document.querySelector('.wallet-modal-content').scrollBy({ top: 200, behavior: 'smooth' })}
        >
          ↓ Scroll Down
        </button>
      </div> */}

      {/* Konten utama modal dengan scroll */}
      <div className="wallet-modal-content">
        <h3>Admin Wallet Management</h3>
        
        {/* Form untuk menambah wallet baru */}
        <div className="wallet-form">
          <h4>Add New Wallet</h4>
          <div className="form-group-depman">
            <select
              value={newWallet.network}
              onChange={(e) => setNewWallet({...newWallet, network: e.target.value})}
            >
              {availableNetworks.map(network => (
                <option key={network.value} value={network.value}>
                  {network.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Wallet Address"
              value={newWallet.address}
              onChange={(e) => setNewWallet({...newWallet, address: e.target.value})}
            />
            <button 
              className="btn-add-wallet"
              onClick={addAdminWallet}
            >
              Add Wallet
            </button>
          </div>
        </div>

        {/* Daftar wallet yang sudah ada dengan select list */}
        <div className="wallet-list">
          <h4>Existing Wallets</h4>
          
          {/* Group wallets by network */}
          {availableNetworks.map(network => {
            const networkWallets = adminWallets.filter(wallet => wallet.network === network.value);
            const defaultWallet = adminWallets.find(wallet => wallet.network === network.value && wallet.is_default);
            
            return (
              <div key={network.value} className="network-wallet-group">
                <h5 className="network-title">{network.label} Wallets</h5>
                
                {networkWallets.length === 0 ? (
                  <p className="no-wallets">No {network.label} wallets configured yet.</p>
                ) : (
                  <>
                    {/* Select list untuk memilih default wallet */}
                    <div className="default-wallet-selector">
                      <label>Default Wallet for {network.label}:</label>
                      <select
                        value={defaultWallet?.id || ""}
                        onChange={(e) => handleSetDefaultWallet(network.value, parseInt(e.target.value))}
                        className="wallet-select"
                      >
                        <option value="">Select Default Wallet</option>
                        {networkWallets.map(wallet => (
                          <option key={wallet.id} value={wallet.id}>
                            {wallet.address} {wallet.is_default ? "(Current Default)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* List wallets untuk network ini */}
                    {networkWallets.map(wallet => (
                      <div key={wallet.id} className={`wallet-item ${wallet.is_default ? 'default-wallet' : ''}`}>
                        <div className="wallet-info">
                          <span className="wallet-network">{wallet.network}</span>
                          <span className="wallet-address">{wallet.address}</span>
                          {/* {wallet.is_default && (
                            <span className="default-badge">Default</span>
                          )} */}
                        </div>
                        <div className="wallet-actions">
                          {!wallet.is_default && (
                            <button 
                              className="btn-set-default"
                              onClick={() => handleSetDefaultWallet(network.value, wallet.id)}
                            >
                              Set Default
                            </button>
                          )}
                          <button 
                            className="btn-delete-wallet"
                            onClick={() => deleteAdminWallet(wallet.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
)}

      {/* Modal Wallet (tetap sama) */}

      {/* Deposit Requests */}
      <div className="deposit-card-depman">
        <div className="card-header">
          <h3>Deposit Requests</h3>
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
              <option value="cancelled">Cancelled</option> {/* Ditambahkan */}
            </select>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              <option value="">Month</option>
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
            
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
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>User's Request</th>
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
                    <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
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
                        className={`status-badge ${(item.status || '')
                          .toLowerCase()
                          .replace(" ", "-")
                          .replace("cancelled", "cancelled")}`} // Diperbarui
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>{item.top_up_date}</td>
<td>
  <div className="action-buttons-depman">
    <button
      className="action-btn-view-depman"
      onClick={() => handleViewDeposit(item)}
      title="View Details"
    >
      👁
    </button>
    
    {/* Tombol untuk deposit dengan status tertentu */}
    {item.status === "Checking Deposit" && (
      <>
        <button
          className="action-btn-approve-deposit"
          onClick={() => handleProcessDeposit(item.id, "approve")}
          title="Approve Deposit"
        >
          ✔
        </button>
        <button
          className="action-btn-danger-deposit"
          onClick={() => handleProcessDeposit(item.id, "reject")}
          title="Reject Deposit"
        >
          ✖
        </button>
      </>
    )}
    
    {/* Tombol delete untuk semua status kecuali completed/approved */}
    {(item.status !== "Deposit Success" && item.status !== "approved") && (
      <button
        className="action-btn-delete-deposit"
        onClick={() => handleDeleteDeposit(item.id)}
        title="Delete Deposit"
      >
        🗑️
      </button>
    )}
  </div>
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
</div>

      {/* Converted Commission History */}
      <div className="deposit-card-depman">
<div className="card-header">
  <h3>Converted Commission History</h3>
  <div className="filters">
    <input
      type="text"
      placeholder="Search by user..."
      value={searchCommission}
      onChange={(e) => setSearchCommission(e.target.value)}
    />
    <select
      value={filterCommissionStatus}
      onChange={(e) => setFilterCommissionStatus(e.target.value)}
    >
      <option value="">Status</option>
      <option value="success">Success</option>
      <option value="failed">Failed</option>
    </select>
    <select
      value={filterCommissionMonth}
      onChange={(e) => setFilterCommissionMonth(e.target.value)}
    >
      <option value="">Month</option>
      {commissionMonthOptions.map((month) => (
        <option key={month} value={month}>
          {month}
        </option>
      ))}
    </select>
  </div>
</div>


        {loadingCommissions ? (
  <p>Loading commission history...</p>
) : filteredCommissionData.length === 0 ? (
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
        <th>Status</th>
        <th>Convert Date</th>
      </tr>
    </thead>
    <tbody>
      {filteredCommissionData.map((item, index) => (
        <tr key={item.id}>
          <td>{index + 1}</td>
          <td>{item.user}</td>
          <td>{item.amount}</td>
          <td>{item.status}</td>
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
