import React from "react";
import "../../style/admin/TransactionDetail.css";

export default function TransactionDetail({ deposit, onClose, onProcess }) {
  return (
    <div className="transaction-container" onClick={onClose}>
      <div className="transaction-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✖</button>

        <h3 className="transaction-title">Transaction Detail</h3>

        {/* Status */}
        <div className={`status-badge ${deposit.status.toLowerCase().replace(" ", "-")}`}>
          {deposit.status}
        </div>

        {/* Payment Info */}
        <div className="section">
          <h4>Payment</h4>
          <div className="info-row">
            <span>ID Deposit</span>
            <strong>{deposit.id}</strong>
          </div>
          <div className="info-row">
            <span>Payment Date</span>
            <strong>{deposit.top_up_date}</strong>
          </div>
          <div className="info-row">
            <span>Recipient Wallet Address</span>
            <strong>
              {deposit.recipient_wallet || "N/A"} 
              <button className="icon-btn">👁</button>
            </strong>
          </div>
          <div className="info-row">
            <span>User’s Wallet Address</span>
            <strong>
              {deposit.user_wallet || "N/A"} 
              <button className="icon-btn">👁</button>
            </strong>
          </div>
          <div className="info-row">
            <span>Transfer Evidence</span>
            {deposit.evidence ? (
              <a href={deposit.evidence} target="_blank" rel="noreferrer">
                {deposit.evidence.split("/").pop()} ⬇
              </a>
            ) : "-"}
          </div>
        </div>

        {/* User Request */}
        <div className="section">
          <h4>User’s Request</h4>
          <div className="info-row">
            <span>Full Name</span>
            <strong>{deposit.user_request}</strong>
          </div>
        </div>

        {/* Buttons */}
        <div className="action-buttons">
          <button className="btn secondary" onClick={onClose}>Back</button>
          {deposit.status === "Checking Deposit" && (
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
  );
}
