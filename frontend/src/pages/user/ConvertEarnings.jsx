import React, { useState } from "react";
import "./ConvertEarnings.css";

const ConvertEarnings = () => {
  const [amount, setAmount] = useState("");
  const currentEarnings = 50000;
  const minConvert = 10000;

  const handleConvertAll = () => {
    setAmount(currentEarnings.toLocaleString("id-ID"));
  };

  return (
    <div className="convert-earnings-container">
      <h2 className="title">Convert Earnings</h2>

      <div className="card">
        <p className="label">Current Earnings</p>
        <h1 className="earnings">
          ${currentEarnings.toLocaleString("id-ID")}
        </h1>
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
            type="text"
            placeholder="e.g 10.000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button className="convert-all" onClick={handleConvertAll}>
            Convert All
          </button>
        </div>
        <p className="credits">
          Your current credits would be is $0
        </p>
      </div>

      <div className="button-group">
        <button className="back-btn">Back</button>
        <button className="convert-btn" disabled>
          Convert
        </button>
      </div>
    </div>
  );
};

export default ConvertEarnings;
