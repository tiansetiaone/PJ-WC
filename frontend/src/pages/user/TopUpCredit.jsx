import React, { useEffect, useState } from "react";
import "../../style/user/TopUpCredit.css";
import { fetchApi } from "../../utils/api";
import { useNavigate } from "react-router-dom";

const TopUpCredit = () => {
  const [amounts, setAmounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const navigate = useNavigate();

  // Ambil data nominal dari backend
  useEffect(() => {
    const loadAmounts = async () => {
      try {
        const res = await fetchApi("/deposits/admin/amounts");
        setAmounts(res.data || []);
      } catch (err) {
        console.error("Error fetching amounts:", err.message);
      } finally {
        setLoading(false);
      }
    };
    loadAmounts();
  }, []);

// TopUpCredit.jsx
const handleConfirm = () => {
  let amount;
  if (selected !== null && amounts[selected]) {
    amount = amounts[selected].value;
  } else {
    amount = customAmount;
  }

  // Simpan sementara di localStorage
  localStorage.setItem("topupAmount", amount);

  // Pindah ke step berikutnya (misalnya halaman upload proof)
  navigate("/deposits/topup2");
};


  if (loading) return <p>Loading...</p>;

  return (
    <div className="topup-container">
      <div className="breadcrumb">Deposit &gt; Top Up Credit</div>
      <h1 className="title">Top Up Credit</h1>

      {/* Step Indicator */}
      <div className="steps">
        <div className="step active">
          1 <span>Top Up Deposit</span>
        </div>
        <div className="step">2 <span>Check Payment</span></div>
        <div className="step">3 <span>Payment Instruction</span></div>
      </div>

      {/* Nominal Section */}
      <div className="nominal-section">
        <h3>Choose Nominal</h3>

        <div className="nominal-grid">
          {amounts.map((item, index) => (
            <div
              key={item.id || index}
              className={`nominal-card ${selected === index ? "selected" : ""}`}
              onClick={() => {
                setSelected(index);
                setCustomAmount("");
              }}
            >
              {item.best && <div className="best-badge">BEST</div>}
              <div className="amount">${item.value}</div>
              <div className="credits">Get {item.credits} credits</div>
            </div>
          ))}
        </div>

        {/* Custom input */}
        <div className="custom-input">
          <label>Input Another Nominal</label>
          <input
            type="number"
            placeholder="More than $20,000..."
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelected(null);
            }}
          />
        </div>

        <p className="info-text">ⓘ Every $1 will get 100 credits</p>
        <button
          className="confirm-btn"
          disabled={!selected && !customAmount}
          onClick={handleConfirm}
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

export default TopUpCredit;
