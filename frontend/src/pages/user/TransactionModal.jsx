import React from "react";
import "../../style/user/TransactionModal.css";

const TransactionModal = ({ show, onClose, deposit, loading, error }) => {
  if (!show) return null;

  const renderStatusBanner = (status) => {
    if (status === "checking") {
      return (
        <div className="banner checking">
          <span>
            ℹ Your transaction currently under checking in our system, please wait a moment.
          </span>
        </div>
      );
    }
    if (status === "success") {
      return null; // banner tidak muncul
    }
    if (status === "failed") {
      return (
        <div className="banner failed">
          <span>⚠ Your transaction failed because you reached the time limit.</span>
        </div>
      );
    }
  };

  const renderStatusBadge = (status) => {
    if (status === "checking")
      return <span className="badge checking">🔍 Checking Deposit</span>;
    if (status === "success")
      return <span className="badge success">✔ Deposit Success</span>;
    if (status === "failed")
      return <span className="badge failed">✖ Deposit Failed</span>;
    return null;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✖
        </button>

        {loading && <p>Loading detail...</p>}
        {error && <p className="error">{error}</p>}

        {deposit && (
          <div className="modal-body">
            {/* Banner status di atas */}
            {renderStatusBanner(deposit.status)}

            <div className="modal-header">
              <h2>Transaction</h2>
              <div className="right-actions">
                {deposit.status === "success" && (
                  <button className="btn-download">Download Receipt</button>
                )}
                {renderStatusBadge(deposit.status)}
              </div>
            </div>

            <h3 className="section-title">Payment</h3>

            <div className="info-row">
              <span>ID Deposit</span>
              <span className="value">{deposit.id}</span>
            </div>
            <div className="info-row">
              <span>Payment Date</span>
              <span className="value">{deposit.updated_at}</span>
            </div>
            <div className="info-row">
              <span>Recipient Wallet Address</span>
              <span className="value">{deposit.recipient_wallet} 👁</span>
            </div>
            <div className="info-row">
              <span>Your Wallet Address</span>
              <span className="value">{deposit.your_wallet} 👁</span>
            </div>
            <div className="info-row">
              <span>Transfer Evidence</span>
              <span className="value">
                <a
                  href={deposit.transfer_evidence}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  proof-of-transfer.png ⬇
                </a>
              </span>
            </div>
            {deposit.tx_link && (
              <div className="info-row">
                <span>Etherscan Transaction Link</span>
                <a
                  href={deposit.tx_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="value link"
                >
                  {deposit.tx_link}
                </a>
              </div>
            )}

            <div className="info-row bold">
              <span>Top Up</span>
              <span className="value">${deposit.amount}</span>
            </div>
            <div className="info-row bold">
              <span>Convert to Credit</span>
              <span className="value credit">{deposit.credit}</span>
            </div>

            {/* Footer button */}
            <div className="modal-footer">
              <button className="btn-back" onClick={onClose}>
                Back
              </button>
              {(deposit.status === "success" || deposit.status === "failed") && (
                <button className="btn-primary">Create New Credit</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionModal;
