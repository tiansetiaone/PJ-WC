import React, { useState } from "react";
import "../../style/admin/TransactionDetail.css";

export default function TransactionDetail({ deposit, onClose, onProcess }) {
  const [showProofModal, setShowProofModal] = useState(false);
  const [userUSDTInfo, setUserUSDTInfo] = useState(null);


    useEffect(() => {
    const storedDeposit = JSON.parse(localStorage.getItem("depositData"));
    if (storedDeposit?.userUSDTInfo) {
      setUserUSDTInfo(storedDeposit.userUSDTInfo);
    }
  }, []);
  
  if (!deposit) return null;

  // Helper: generate URL bukti transfer
  const getProofUrl = (file) => {
    if (!file) return null;
    const normalized = file.replace(/\\/g, "/");
    if (normalized.startsWith("http")) return normalized;
    return `http://localhost:5000/${normalized.startsWith("uploads/") ? normalized : `uploads/${normalized}`}`;
  };

  // Helper: format tanggal
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

  // Fungsi untuk mendapatkan usdt_address dengan cara yang sama seperti TransactionModal
  const getUserUSDTAddress = () => {
    const addr =
      (userUSDTInfo?.usdt_address && userUSDTInfo.usdt_address !== "0" && userUSDTInfo.usdt_address) ||
      (deposit.user?.usdt_address && deposit.user.usdt_address !== "0" && deposit.user.usdt_address) ||
      (deposit.deposit?.user?.usdt_address && deposit.deposit.user.usdt_address !== "0" && deposit.deposit.user.usdt_address) ||
      (deposit.usdt_address && deposit.usdt_address !== "0" && deposit.usdt_address) ||
      null;

    return addr ? addr : "Not Available";
  };


  // Fungsi untuk memformat alamat wallet (sama seperti di TransactionModal)
  const formatWalletAddress = (address) => {
    if (!address || address === "N/A") return "Not Available";
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
  };

  return (
    <>
      <div className="transaction-details-container" onClick={onClose}>
        <div className="transaction-card" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>✖</button>

          <h3 className="transaction-title">Transaction Detail</h3>

          {/* Status Badge dengan support cancelled */}
          <div className={`status-badge ${(deposit.status || '')
            .toLowerCase()
            .replace(" ", "-")
            .replace("cancelled", "cancelled")}`}>
            {deposit.status || 'Unknown Status'}
          </div>

          {/* Payment Info */}
          <div className="section">
            <h4>Payment</h4>
            <div className="info-row">
              <span>ID Deposit</span>
              <strong>{deposit.id || 'N/A'}</strong>
            </div>
            <div className="info-row">
              <span>Payment Date</span>
              <strong>{formatDate(deposit.top_up_date || deposit.created_at)}</strong>
            </div>
            <div className="info-row">
              <span>Recipient Wallet Address</span>
              <strong>
                {deposit.recipient_wallet || deposit.destination_address || "N/A"} 
                <button className="icon-btn">👁</button>
              </strong>
            </div>
<div className="info-row">
  <span>User's Wallet Address</span>
  <strong>
    {formatWalletAddress(getUserUSDTAddress())}
    <button className="icon-btn">👁</button>
  </strong>
</div>
            
            {/* TRANSFER EVIDENCE - PERBAIKAN */}
            <div className="info-row">
              <span>Transfer Evidence</span>
              <strong>
                {deposit.evidence || deposit.proof_file ? (
                  <button 
                    className="proof-link-btn"
                    onClick={() => setShowProofModal(true)}
                  >
                    Click to see the proof
                  </button>
                ) : deposit.tx_hash ? (
                  <span>No proof uploaded (TX Hash: {deposit.tx_hash})</span>
                ) : (
                  <span>No proof uploaded</span>
                )}
              </strong>
            </div>

            <div className="info-row">
              <span>Network</span>
              <strong>{deposit.network || 'N/A'}</strong>
            </div>
            <div className="info-row">
              <span>Amount</span>
              <strong>{deposit.amount ? `$${deposit.amount}` : 'N/A'}</strong>
            </div>
            
            {/* Transaction Hash jika ada */}
            {deposit.tx_hash && (
              <div className="info-row">
                <span>Transaction Hash</span>
                <strong>{deposit.tx_hash}</strong>
              </div>
            )}
            
            {/* Transaction Link jika ada */}
            {deposit.tx_link && (
              <div className="info-row">
                <span>Transaction Link</span>
                <a href={deposit.tx_link} target="_blank" rel="noreferrer" className="tx-link">
                  View on Block Explorer ↗
                </a>
              </div>
            )}
          </div>

          {/* User Request */}
          <div className="section">
            <h4>User's Request</h4>
            <div className="info-row">
              <span>Full Name</span>
              <strong>{deposit.user_request || deposit.username || 'N/A'}</strong>
            </div>
            <div className="info-row">
              <span>Email</span>
              <strong>{deposit.email || 'N/A'}</strong>
            </div>
          </div>

          {/* Admin Notes jika ada */}
          {deposit.admin_notes && (
            <div className="section">
              <h4>Admin Notes</h4>
              <div className="info-row">
                <span>Notes</span>
                <strong>{deposit.admin_notes}</strong>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="action-buttons-tr-detail">
            <button className="btn secondary" onClick={onClose}>Back</button>
            {(deposit.status === "Checking Deposit" || deposit.status === "checking") && (
              <>
                <button
                  className="btn danger"
                  onClick={() => {
                    onProcess(deposit.id, "reject");
                    onClose();
                  }}
                >
                  Reject
                </button>
                <button
                  className="btn primary"
                  onClick={() => {
                    onProcess(deposit.id, "approve");
                    onClose();
                  }}
                >
                  Approve
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal Popup untuk Proof Evidence */}
      {showProofModal && (
        <div className="modal-overlay-proof" onClick={() => setShowProofModal(false)}>
          <div className="modal-content-proof proof-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowProofModal(false)}>
              ✖
            </button>
            <h3>Transfer Evidence</h3>
            <img
              src={getProofUrl(deposit.evidence || deposit.proof_file)}
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
                href={getProofUrl(deposit.evidence || deposit.proof_file)} 
                target="_blank" 
                rel="noreferrer"
                className="btn primary"
              >
                Open in New Tab
              </a>
              <button className="btn secondary" onClick={() => setShowProofModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}