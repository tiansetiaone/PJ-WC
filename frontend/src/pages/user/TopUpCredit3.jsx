import React, { useEffect, useState } from "react";
import "../../style/user/TopUpCredit3.css";
import UploadProof from "./UploadProof";

export default function TopUpCredit3() {
  const [deposit, setDeposit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const depositId = localStorage.getItem("deposit_id");

  const fetchDepositDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/deposits/status/${depositId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (data.success) {
        setDeposit(data.data);
      } else {
        alert(data.error || "Failed to fetch deposit status");
      }
    } catch (err) {
      console.error("Error fetching deposit details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepositDetails();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="topup3-container">
      <div className="breadcrumb">
        <span>Deposit</span> &gt; <span className="active">Top Up Credit</span>
      </div>

      <h2 className="page-title">Top Up Credit</h2>

      <div className="steps">
        <div className="step active">
          1<br />Top Up Deposit
        </div>
        <div className="step active">
          2<br />Check Payment
        </div>
        <div className="step active">
          3<br />Payment Instruction
        </div>
      </div>

      <div className="payment-box">
        <h3>Payment Instruction</h3>

        {loading ? (
          <p>Loading...</p>
        ) : deposit ? (
          <>
            <div className="wallet-info">
              <img
                src="https://cryptologos.cc/logos/tether-usdt-logo.png"
                alt="USDT"
                className="wallet-icon"
              />
              <div>
                <p>Recipient Wallet Address ({deposit.network})</p>
                <a href="#">{deposit.recipient_wallet}</a>
              </div>
            </div>

            <div className="payment-details">
              <div>
                <strong>ID Deposit</strong> <span>{deposit.id}</span>
              </div>
              <div>
                <strong>Status</strong> <span>{deposit.status}</span>
              </div>
              <div>
                <strong>Payment Date</strong>{" "}
                <span>{new Date(deposit.created_at).toLocaleString()}</span>
              </div>
              <div>
                <strong>Your Wallet (Memo)</strong>{" "}
                <span>{deposit.your_wallet}</span>
              </div>
              <div>
                <strong>Top Up</strong>{" "}
                <span className="amount">${deposit.amount}</span>
              </div>
              <div>
                <strong>Convert to Credit</strong>{" "}
                <span className="credit">{deposit.amount * 100}</span>
              </div>
            </div>

            <div className="btn-group">
              <button
                className="btn-back"
                onClick={() => window.history.back()}
              >
                Back
              </button>
              <button
                className="btn-done"
                onClick={() => setShowUploadModal(true)}
              >
                Payment Done
              </button>
            </div>
          </>
        ) : (
          <p>Deposit not found</p>
        )}
      </div>

      <div className="info-box">
        <h3>Top Up Information</h3>
        <ol>
          <li>
            Choose TRC20 Network, make sure your wallet/exchange supports
            USDT-TRC20 (Tron blockchain).
          </li>
          <li>
            Complete your transfer before the countdown ends (1 hour).
          </li>
        </ol>
      </div>

      {/* Modal UploadProof */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content-payment">
            <UploadProof depositId={depositId} onClose={() => setShowUploadModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
