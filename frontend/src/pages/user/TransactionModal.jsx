import React, { useState, useEffect } from "react";
import "../../style/user/TransactionModal.css";

const TransactionModal = ({ show, onClose, deposit, loading, error }) => {
  const [showProof, setShowProof] = useState(false);
  const [depositData, setDepositData] = useState(null);
  const [userUSDTInfo, setUserUSDTInfo] = useState(null);


  // Update depositData ketika deposit prop berubah
useEffect(() => {
  if (deposit) {
    setDepositData(deposit);
  } else {
    // fallback ambil dari localStorage
    const storedDeposit = JSON.parse(localStorage.getItem("depositData"));
    if (storedDeposit) {
      setDepositData(storedDeposit);
      if (storedDeposit.userUSDTInfo) {
        setUserUSDTInfo(storedDeposit.userUSDTInfo);
      }
    }
  }
}, [deposit]);


  if (!show) return null;

  // Banner di atas modal
  const renderStatusBanner = (status) => {
    const statusLower = (status || "").toLowerCase();
    
    if (statusLower.includes("cancelled") || statusLower.includes("cancel")) {
      return (
        <div className="banner cancelled">
          <span>❌ Your transaction has been cancelled.</span>
        </div>
      );
    }
    
    const statusMap = {
      'pending': 'checking',
      'processing': 'checking',
      'waiting_payment': 'checking',
      'completed': 'success',
      'rejected': 'failed',
      'failed': 'failed'
    };

    const currentStatus = statusMap[statusLower] || 'checking';

    if (currentStatus === "checking") {
      return (
        <div className="banner checking">
          <span>ℹ Your transaction currently under checking in our system, please wait a moment.</span>
        </div>
      );
    }
    if (currentStatus === "success") {
      return null;
    }
    if (currentStatus === "failed") {
      return (
        <div className="banner failed">
          <span>⚠ Your transaction failed because you reached the time limit.</span>
        </div>
      );
    }
  };

  // Badge kecil di header kanan
  const renderStatusBadge = (status) => {
    const statusLower = (status || "").toLowerCase();
    
    if (statusLower.includes("cancelled") || statusLower.includes("cancel")) {
      return <span className="badge cancelled">✖ Cancel Transaction</span>;
    }
    
    const statusMap = {
      'pending': { badge: "checking", text: "🔍 Pending", display: "Pending" },
      'processing': { badge: "checking", text: "🔍 Processing", display: "Processing" },
      'waiting_payment': { badge: "checking", text: "⏰ Waiting Payment", display: "Waiting Payment" },
      'completed': { badge: "success", text: "✔ Completed", display: "Completed" },
      'rejected': { badge: "failed", text: "✖ Rejected", display: "Rejected" },
      'failed': { badge: "failed", text: "✖ Failed", display: "Failed" }
    };

    const statusInfo = statusMap[statusLower] || { badge: "checking", text: "🔍 Checking", display: "Checking" };
    return <span className={`badge ${statusInfo.badge}`}>{statusInfo.text}</span>;
  };

  // Helper: generate URL bukti transfer
  const getProofUrl = (file) => {
    if (!file) return null;
    const normalized = file.replace(/\\/g, "/");
    if (normalized.startsWith("http")) return normalized;
    return `http://localhost:5000/${normalized.startsWith("uploads/") ? normalized : `uploads/${normalized}`}`;
  };

  // Helper: format tanggal jadi DD Month YYYY HH:MM
  const formatDate = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(dateString);
    if (isNaN(date)) return dateString;

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fungsi untuk menampilkan alamat wallet dengan format yang rapi
  const formatWalletAddress = (address) => {
    if (!address) return "Not Available";
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
  };

  return (
    <>
      {/* Modal utama transaksi */}
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close-transaction" onClick={onClose}>
            ✖
          </button>

          {loading && <p className="loading-text">Loading transaction details...</p>}
          {error && <p className="error">{error}</p>}

          {depositData ? (
            <div className="modal-body">
              {/* Banner status */}
              {renderStatusBanner(depositData.deposit?.status || depositData.status)}

              {/* Header */}
              <div className="modal-header">
                <h2>Transaction Details</h2>
                <div className="right-actions">
                  {(depositData.deposit?.status === 'completed' || depositData.status === 'completed') && 
                    <button className="btn-download">Download Receipt</button>
                  }
                  {renderStatusBadge(depositData.deposit?.status || depositData.status)}
                </div>
              </div>

              <h3 className="section-title">Payment Information</h3>

              {/* Detail informasi */}
              <div className="info-row">
                <span>ID Deposit</span>
                <span className="value">{depositData.deposit?.masked_id || depositData.masked_id}</span>
              </div>
              
              <div className="info-row">
                <span>Payment Date</span>
                <span className="value">{formatDate(depositData.deposit?.updated_at || depositData.updated_at)}</span>
              </div>
              
              <div className="info-row">
                <span>Recipient Wallet Address</span>
                <span className="value wallet-address" title={depositData.deposit?.recipient_wallet || depositData.recipient_wallet}>
                  {formatWalletAddress(depositData.deposit?.recipient_wallet || depositData.recipient_wallet)} 
                  <span className="eye-icon"> 👁</span>
                </span>
              </div>
              
              <div className="info-row">
  <span>Your Wallet Address</span>
  <span
    className="value wallet-address"
    title={
      (userUSDTInfo?.usdt_address &&
        userUSDTInfo.usdt_address !== "0" &&
        userUSDTInfo.usdt_address) ||
      (depositData.user?.usdt_address &&
        depositData.user?.usdt_address !== "0" &&
        depositData.user?.usdt_address) ||
      (depositData.deposit?.user?.usdt_address &&
        depositData.deposit?.user?.usdt_address !== "0" &&
        depositData.deposit?.user?.usdt_address) ||
      "Not Available"
    }
  >
    {userUSDTInfo?.usdt_address && userUSDTInfo.usdt_address !== "0"
      ? formatWalletAddress(userUSDTInfo.usdt_address)
      : depositData.user?.usdt_address &&
        depositData.user?.usdt_address !== "0"
      ? formatWalletAddress(depositData.user.usdt_address)
      : depositData.deposit?.user?.usdt_address &&
        depositData.deposit?.user?.usdt_address !== "0"
      ? formatWalletAddress(depositData.deposit.user.usdt_address)
      : "Not Available"}{" "}
    <span className="eye-icon"> 👁</span>
  </span>
</div>

              {/* Link address wallet user */}
              {(depositData.user?.user_address_link || depositData.deposit?.user?.user_address_link) && (
                <div className="info-row">
                  <span>Etherscan Transaction Link</span>
                  <a 
                    href={depositData.user?.user_address_link || depositData.deposit?.user?.user_address_link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="value link"
                  >
                    {depositData.user?.user_address_link || depositData.deposit?.user?.user_address_link}
                  </a>
                </div>
              )}

              {/* Jumlah */}
              <div className="info-row bold">
                <span>Top Up</span>
                <span className="value">${depositData.deposit?.amount || depositData.amount}</span>
              </div>
              
              <div className="info-row bold">
                <span>Converted to Credit</span>
                <span className="value credit">{depositData.deposit?.credit|| depositData.credit}</span>
              </div>

              {/* Footer */}
              <div className="modal-footer">
                <button className="btn-back" onClick={onClose}>
                  Back
                </button>
                {(depositData.deposit?.status === 'completed' || depositData.status === 'completed') && 
                  <button className="btn-primary">Create New Deposit</button>
                }
              </div>
            </div>
          ) : (
            <div className="no-data">
              <p>No transaction data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal popup bukti transfer */}
      {showProof && (
        <div className="modal-overlay-proof" onClick={() => setShowProof(false)}>
          <div className="modal-content-proof proof-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-transaction" onClick={() => setShowProof(false)}>
              ✖
            </button>
            <h3>Transfer Evidence</h3>
            <img
              src={getProofUrl(
                depositData?.deposit?.transfer_evidence || 
                depositData?.deposit?.proof_file || 
                depositData?.proof_file
              )}
              alt="Proof of Transfer"
              className="proof-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/400x300?text=Proof+Not+Found";
                e.target.alt = "Proof image not available";
              }}
            />
            <div className="proof-actions">
              <a 
                href={getProofUrl(
                  depositData?.deposit?.transfer_evidence || 
                  depositData?.deposit?.proof_file || 
                  depositData?.proof_file
                )} 
                target="_blank" 
                rel="noreferrer"
                className="btn primary"
              >
                Open in New Tab
              </a>
              <button className="btn secondary" onClick={() => setShowProof(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransactionModal;