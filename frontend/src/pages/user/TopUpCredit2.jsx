// TopUpCredit2.jsx - Perbaikan
import React, { useEffect, useState } from "react";
import "../../style/user/TopUpCredit2.css";
import { useNavigate } from "react-router-dom";
import { fetchApi } from "../../utils/api";

export default function TopUpCredit2() {
  const [amount, setAmount] = useState(0);
  const [formattedAmount, setFormattedAmount] = useState("0.00");
  const [credit, setCredit] = useState(0); // FINAL CREDIT (amount * credit rate)
  const [creditRate, setCreditRate] = useState(100); // CREDIT RATE per dollar
  const [network, setNetwork] = useState("TRC20");
  const [deposit, setDeposit] = useState(null);
  const [userUSDTInfo, setUserUSDTInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  

  useEffect(() => {
    const loadData = async () => {
      try {
        const depositData = JSON.parse(localStorage.getItem("depositData"));
        const storedAmount = localStorage.getItem("topupAmount");
        const storedCredit = localStorage.getItem("topupCredit");
        const storedCreditRate = localStorage.getItem("creditRate");
        const storedNetwork = localStorage.getItem("topupCurrency");
        
        if (depositData && depositData.success) {
          setDeposit(depositData);
          setNetwork(storedNetwork || depositData.network || "TRC20");
          
          if (storedAmount) {
            const numValue = parseFloat(storedAmount);
            if (!isNaN(numValue)) {
              setAmount(numValue);
              setFormattedAmount(numValue.toFixed(2));
            }
          }

          // SET FINAL CREDIT DAN CREDIT RATE
          if (storedCredit) {
            setCredit(parseInt(storedCredit));
          } else if (depositData.credit) {
            setCredit(depositData.credit);
          }

          if (storedCreditRate) {
            setCreditRate(parseFloat(storedCreditRate));
          } else if (depositData.credit_rate) {
            setCreditRate(depositData.credit_rate);
          }

            if (depositData.userUSDTInfo) {
    setUserUSDTInfo(depositData.userUSDTInfo);
  }

        } else {
          alert("No deposit data found");
          navigate("/deposits/topup");
        }

        // Fetch user USDT info
        // const usdtInfoRes = await fetchApi("/deposits/user/usdt-info");
        // if (usdtInfoRes.success) {
        //   setUserUSDTInfo(usdtInfoRes.data);
        // }
      } catch (err) {
        console.error("Error loading deposit data:", err);
        alert("Error loading deposit information");
        navigate("/deposits/topup");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  // Format wallet address untuk tampilan
  const formatWalletAddress = (address) => {
    if (!address) return "Not Available";
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
  };

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
            <p>Loading transaction details...</p>
          ) : deposit ? (
            <>
              <div className="transaction-item">
                <span>Recipient Wallet Address</span>
                <span className="wallet" title={deposit.address}>
                  {formatWalletAddress(deposit.address)}
                </span>
              </div>

              <div className="transaction-item">
                <span>Your Wallet (Memo)</span>
                <span className="wallet" title={deposit.memo}>
                  {formatWalletAddress(deposit.memo)}
                </span>
              </div>

<div className="transaction-item">
  <span>Your Wallet (USDT)</span>
  <span className="wallet" title={userUSDTInfo?.usdt_address}>
    {userUSDTInfo?.usdt_address ? formatWalletAddress(userUSDTInfo.usdt_address) : "Not set"}
  </span>
</div>

              <div className="transaction-item">
                <span>Network</span>
                <span className="wallet">{network}</span>
              </div>

              <div className="transaction-item">
                <span>Top Up Amount</span>
                <span className="amount">${formattedAmount}</span>
              </div>

            <div className="transaction-item">
              <span>Credit Rate</span>
              <span className="credit-rate">{creditRate} credits</span>
            </div>

              <div className="transaction-item important-note">
                <span>⚠️ Important</span>
                <span>Complete transfer within 1 hour</span>
              </div>

              <div className="buttons">
                <button className="btn-back" onClick={() => navigate("/deposits/topup")}>
                  Back
                </button>
                <button className="btn-proceed" onClick={handleProceed}>
                  Proceed to Payment
                </button>
              </div>
            </>
          ) : (
            <p>Unable to load deposit details. Please try again.</p>
          )}
        </div>
      </main>
    </div>
  );
}