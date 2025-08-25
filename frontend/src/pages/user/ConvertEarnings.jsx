import React, { useState, useEffect } from "react";
import { fetchApi } from "../../utils/api";
import "../../style/user/ConvertEarnings.css";

const ConvertEarnings = ({ onClose, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState({ available: 0, converted: 0 });
  const [minConvert, setMinConvert] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Ambil balance + role (buat tahu min_conversion)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const bal = await fetchApi("/referrals/balance");
        setBalance(bal);

        // Ambil detail role user
        const role = await fetchApi("/auth/conversion-rules"); // pastikan endpoint ini ada utk ambil req.user
        setMinConvert(role?.min_conversion || 10);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleConvertAll = () => {
    setAmount(balance.available);
  };

  const handleSubmit = async () => {
    if (!amount || isNaN(amount)) {
      setError("Invalid amount");
      return;
    }
    if (amount < minConvert) {
      setError(`Minimum convert is ${minConvert} USDT`);
      return;
    }
    if (amount > balance.available) {
      setError("Amount exceeds available balance");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await fetchApi("/referrals/convert", {
        method: "POST",
        body: { amount: Number(amount) },
      });
      alert(`Successfully converted $${amount}`);
      if (onSuccess) onSuccess(); // refresh dashboard
      onClose(); // tutup modal
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="convert-earnings-container">Loading...</div>;

  return (
    <div className="convert-earnings-container">
      <h2 className="title">Convert Earnings</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="card">
        <p className="label">Current Earnings</p>
        <h1 className="earnings">${balance.available.toLocaleString("id-ID")}</h1>
        <p className="eligible">
          ✅ Eligible to convert (min. convert ${minConvert.toLocaleString("id-ID")})
        </p>
      </div>

      <div className="form-group">
        <label className="amount-label">
          <span className="required">*</span> Amount
        </label>
        <div className="input-group">
          <span className="currency-symbol">$</span>
          <input
            type="number"
            placeholder={`min ${minConvert}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button className="convert-all" onClick={handleConvertAll}>
            Convert All
          </button>
        </div>
        <p className="credits">Your converted balance is ${balance.converted}</p>
      </div>

      <div className="button-group">
        <button className="back-btn" onClick={onClose}>Back</button>
        <button
          className="convert-btn"
          onClick={handleSubmit}
          disabled={submitting || amount < minConvert || amount > balance.available}
        >
          {submitting ? "Converting..." : "Convert"}
        </button>
      </div>
    </div>
  );
};

export default ConvertEarnings;
