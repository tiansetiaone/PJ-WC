import React, { useEffect, useState } from "react";
import "../../style/user/TopUpCredit3.css";
import UploadProof from "./UploadProof";

export default function TopUpCredit3() {
  const [depositData, setDepositData] = useState(null);
  const [userUSDTInfo, setUserUSDTInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600);
  const depositId = localStorage.getItem("deposit_id");


  // Fetch deposit details dengan auto-refresh
  const fetchDepositDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/deposits/status/${depositId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        setDepositData(data.data);

        // Hitung sisa waktu berdasarkan created_at
        if (data.data.deposit && data.data.deposit.created_at) {
          const createdAt = new Date(data.data.deposit.created_at);
          const now = new Date();
          const elapsedSeconds = Math.floor((now - createdAt) / 1000);
          const remaining = Math.max(0, 3600 - elapsedSeconds);
          setTimeLeft(remaining);
        }
      } else {
        console.error("Failed to fetch deposit status:", data.error);
      }
    } catch (err) {
      console.error("Error fetching deposit details:", err);
    } finally {
      setLoading(false);
    }
  };

  // Setup auto-refresh dan countdown
  useEffect(() => {
    fetchDepositDetails(); // Initial fetch

    // Auto-refresh setiap 30 detik
    const refreshInterval = setInterval(fetchDepositDetails, 30000);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
    };
  }, [depositId]);

  // Format waktu countdown
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Format wallet address untuk tampilan
  const formatWalletAddress = (address) => {
    if (!address) return "Not Available";
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
  };

  // Di useEffect TopUpCredit3.jsx, tambahkan pengecekan
  // Ganti state & useEffect
useEffect(() => {
  const loadDepositData = async () => {
    try {
      // Ambil dari localStorage dulu
      let storedDeposit = JSON.parse(localStorage.getItem("depositData"));

      if (storedDeposit) {
        setDepositData(storedDeposit);
        if (storedDeposit.userUSDTInfo) {
          setUserUSDTInfo(storedDeposit.userUSDTInfo);
        }
      } else if (depositId) {
        // Kalau tidak ada di localStorage → fetch dari API
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/deposits/status/${depositId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (data.success) {
          setDepositData(data.data);
          // kalau di response ada wallet user, masukkan juga
          if (data.data.userUSDTInfo) {
            setUserUSDTInfo(data.data.userUSDTInfo);
          }
        }
      }
    } catch (error) {
      console.error("Error loading deposit data:", error);
    } finally {
      setLoading(false);
    }
  };

  loadDepositData();
}, [depositId]);


  return (
    <div className="topup3-container">
      <div className="breadcrumb">
        <span>Deposit</span> &gt; <span className="active">Top Up Credit</span>
      </div>

      <h2 className="page-title">Top Up Credit</h2>

      <div className="steps">
        <div className="step active">
          1<br />
          Top Up Deposit
        </div>
        <div className="step active">
          2<br />
          Check Payment
        </div>
        <div className="step active">
          3<br />
          Payment Instruction
        </div>
      </div>

      {/* Countdown Timer */}
      {timeLeft > 0 && (
        <div className={`countdown-timer ${timeLeft < 300 ? "warning" : ""}`}>
          ⏰ Time remaining: {formatTime(timeLeft)}
          {timeLeft < 300 && <span> - Hurry up!</span>}
        </div>
      )}

      {timeLeft === 0 && <div className="countdown-timer expired">⚠️ Deposit window expired. Please start a new deposit.</div>}

      <div className="payment-box">
        <h3>Payment Instruction</h3>

        {loading ? (
          <p>Loading deposit information...</p>
        ) : depositData?.deposit ? (
          <>
<div className="wallet-info">
  <img
    src="https://cryptologos.cc/logos/tether-usdt-logo.png"
    alt="USDT"
    className="wallet-icon"
  />
  <div>
    <p>Recipient Wallet Address ({depositData.deposit.network})</p>
    <div className="wallet-address-container">
      <a
        href={depositData.deposit.address_link}
        target="_blank"
        rel="noreferrer"
        className="wallet-address-link"
      >
        {depositData.deposit.destination_address || depositData.deposit.recipient_wallet || "N/A"}
      </a>
      <button
        className="copy-btn-top3"
        onClick={() => {
          const value =
            depositData.deposit.destination_address || depositData.deposit.recipient_wallet || "";
          if (value) {
            navigator.clipboard.writeText(value);
            alert("Wallet address copied to clipboard!");
          }
        }}
      >
        📋
      </button>
    </div>
  </div>
</div>

            <div className="payment-details">
              <div>
                <strong>ID Deposit</strong> <span>{depositData.deposit.id}</span>
              </div>
              <div>
                <strong>Status</strong> <span className={`status-${depositData.deposit.status}`}>{depositData.deposit.status}</span>
              </div>
              <div>
                <strong>Payment Date</strong> <span>{new Date(depositData.deposit.created_at).toLocaleString()}</span>
              </div>
              <div>
                <strong>Your Wallet (Memo)</strong> <span title={depositData.deposit.memo}>{formatWalletAddress(depositData.deposit.memo)}</span>
              </div>
<div>
  <strong>Your Wallet (USDT)</strong>
  <span title={userUSDTInfo?.usdt_address}>
    {userUSDTInfo?.usdt_address ? formatWalletAddress(userUSDTInfo.usdt_address) : "Not set"}
  </span>
</div>
              <div>
                <strong>Network</strong> <span>{depositData.deposit.network}</span>
              </div>
              <div>
                <strong>Top Up Amount</strong> <span className="amount">${depositData.deposit.amount}</span>
              </div>
<div>
  <strong>Convert to Credit</strong> 
  <span className="credit">{depositData.deposit.credit} credits</span>
</div>
            </div>

            {depositData.deposit.status === "pending" && timeLeft > 0 && (
              <div className="btn-group">
                <button className="btn-back" onClick={() => window.history.back()}>
                  Back
                </button>
                <button className="btn-done" onClick={() => setShowUploadModal(true)} disabled={timeLeft === 0}>
                  {timeLeft === 0 ? "Time Expired" : "Payment Done"}
                </button>
              </div>
            )}

            {depositData.deposit.status !== "pending" && (
              <div className="status-message">
                <p>
                  Deposit status: <strong>{depositData.deposit.status}</strong>
                </p>
                {depositData.deposit.admin_notes && <p>Admin notes: {depositData.deposit.admin_notes}</p>}
              </div>
            )}
          </>
        ) : (
          <p>Deposit not found. Please check your deposit ID.</p>
        )}
      </div>

      <div className="info-box-credit3">
        <h3>Top Up Information</h3>
        <ol>
          <li>
            Choose {depositData?.deposit?.network || "TRC20"} Network, make sure your wallet/exchange supports USDT-{depositData?.deposit?.network || "TRC20"}.
          </li>
          <li>Complete your transfer before the countdown ends (1 hour).</li>
          <li>After payment, click "Payment Done" to upload proof of transfer.</li>
          <li>Your deposit will be processed within 1-2 hours after verification.</li>
        </ol>
      </div>

      {/* Modal UploadProof */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content-payment">
            <UploadProof
              depositId={depositId}
              onClose={() => {
                setShowUploadModal(false);
                fetchDepositDetails(); // Refresh status setelah upload
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
