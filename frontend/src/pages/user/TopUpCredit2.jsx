import React, { useEffect, useState } from "react";
import "../../style/user/TopUpCredit2.css";
import { useNavigate } from "react-router-dom";


export default function TopUpCredit2() {
  const [amount, setAmount] = useState(localStorage.getItem("topupAmount") || 0);
  const [network, setNetwork] = useState(localStorage.getItem("network") || "TRC20");
  const [deposit, setDeposit] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const convertedCredit = amount * 100; // contoh: 1 USDT = 100 credit

  const initiateDeposit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token"); // JWT token
      const res = await fetch("http://localhost:5000/api/deposits/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          network,
          amount,
          is_custom: false,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDeposit(data);
        localStorage.setItem("deposit_id", data.deposit_id);
        localStorage.setItem("recipient_wallet", data.address);
        localStorage.setItem("user_wallet", data.memo); // pakai memo
      } else {
        alert(data.error || "Failed to initiate deposit");
      }
    } catch (err) {
      console.error("Error initiating deposit:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initiateDeposit();
    // eslint-disable-next-line
  }, []);

  const handleProceed = () => {
    if (!deposit) {
      alert("Please wait until transaction is ready");
      return;
    }
    navigate("/deposits/topup-credit-3"); 
  };

  return (
    <div className="topup-container-topup2">
      <main className="content">
        <div className="breadcrumb">
          <span>Deposit</span> &gt; <span>Top Up Credit</span>
        </div>

        <h2 className="title">Top Up Credit</h2>

        {/* Steps */}
        <div className="steps">
          <div className="step active">1<br />Top Up Deposit</div>
          <div className="step active">2<br />Check Payment</div>
          <div className="step">3<br />Payment Instruction</div>
        </div>

        {/* Transaction Box */}
        <div className="transaction-box">
          <h3>Check Transaction</h3>

          {loading ? (
            <p>Loading transaction...</p>
          ) : deposit ? (
            <>
              <div className="transaction-item">
                <span>Recipient Wallet Address</span>
                <span className="wallet">{deposit.address}</span>
              </div>

              <div className="transaction-item">
                <span>Your Wallet (Memo)</span>
                <span className="wallet">{deposit.memo}</span>
              </div>

              <div className="transaction-item">
                <span>Top Up</span>
                <span className="amount">${amount}</span>
              </div>

              <div className="transaction-item">
                <span>Convert to Credit</span>
                <span className="credit">{convertedCredit}</span>
              </div>

              <div className="buttons">
                <button className="btn-back" onClick={() => window.history.back()}>
                  Back
                </button>
                <button className="btn-proceed" onClick={handleProceed}>
                  Proceed
                </button>
              </div>
            </>
          ) : (
            <p>Unable to load deposit details</p>
          )}
        </div>
      </main>
    </div>
  );
}
