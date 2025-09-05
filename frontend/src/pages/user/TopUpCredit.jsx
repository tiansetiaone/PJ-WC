import React, { useEffect, useState } from "react";
import "../../style/user/TopUpCredit.css";
import { fetchApi } from "../../utils/api";
import { useNavigate } from "react-router-dom";

const TopUpCredit = () => {
  const [amounts, setAmounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [currency, setCurrency] = useState("TRC20");
  const [userUSDTInfo, setUserUSDTInfo] = useState(null);
  const [showAddUSDT, setShowAddUSDT] = useState(false);
  const [newUSDTNetwork, setNewUSDTNetwork] = useState("TRC20");
  const [newUSDTAddress, setNewUSDTAddress] = useState("");
  const navigate = useNavigate();

  // Available currencies
  const availableCurrencies = [
    { value: "TRC20", label: "USDT-TRC20" },
    { value: "ERC20", label: "USDT-ERC20" },
    { value: "BEP20", label: "USDT-BEP20" }
  ];

  // Ambil data nominal dan info USDT user dari backend
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load amounts
        const amountsRes = await fetchApi("/deposits/admin/amounts");
        setAmounts(amountsRes.data || []);
        
        // Load user USDT info
        const usdtInfoRes = await fetchApi("/deposits/user/usdt-info");
        setUserUSDTInfo(usdtInfoRes.data);
        
        // Set default currency berdasarkan USDT network user jika ada
        if (usdtInfoRes.data && usdtInfoRes.data.usdt_network) {
          setCurrency(usdtInfoRes.data.usdt_network);
        }
      } catch (err) {
        console.error("Error fetching data:", err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Fungsi untuk menyimpan USDT baru
  const saveNewUSDT = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/deposits/update-usdt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          usdt_network: newUSDTNetwork,
          usdt_address: newUSDTAddress
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Update state dengan data baru
        setUserUSDTInfo({
          usdt_network: newUSDTNetwork,
          usdt_address: newUSDTAddress
        });
        setCurrency(newUSDTNetwork);
        setShowAddUSDT(false);
        alert("USDT information updated successfully!");
      } else {
        alert(data.error || "Failed to update USDT information");
      }
    } catch (err) {
      console.error("Error saving USDT:", err);
      alert("Error saving USDT information");
    }
  };

  // Handle pemilihan nominal card
  const handleSelectAmount = (index) => {
    setSelected(index);
    setCustomAmount(""); // Reset custom amount ketika memilih nominal card
  };

  // Handle input custom amount
  const handleCustomAmountChange = (e) => {
    setCustomAmount(e.target.value);
    setSelected(null); // Reset selected card ketika input custom amount
  };

  // Handle focus pada input custom (reset selected card)
  const handleCustomInputFocus = () => {
    setSelected(null);
  };

  // Handle klik pada area custom input (reset selected card)
  const handleCustomInputClick = () => {
    setSelected(null);
  };

  const handleConfirm = () => {
    let amount;

    if (selected !== null && amounts[selected]) {
      amount = amounts[selected].value;
    } else {
      amount = parseFloat(customAmount);
    }

    // Validasi minimal $20
    if (amount < 20) {
      alert("Minimum top up is $20.00");
      return;
    }

    // Validasi USDT information
    if (!userUSDTInfo?.usdt_network || !userUSDTInfo?.usdt_address) {
      alert("Please set up your USDT information first");
      return;
    }

    // Simpan sementara di localStorage SAJA (belum masuk database)
    localStorage.setItem("topupAmount", amount);
    localStorage.setItem("topupCurrency", currency);
    localStorage.setItem("topupCredit", amount * 100); // Hitung credit

    // Pindah ke step berikutnya
    navigate("/deposits/topup2");
  };

  // Fungsi untuk mengecek apakah form valid
  const isFormValid = () => {
    let amount;

    if (selected !== null && amounts[selected]) {
      amount = amounts[selected].value;
    } else {
      amount = parseFloat(customAmount);
    }

    // Validasi amount minimal $20
    const isAmountValid = amount >= 20;
    
    // Validasi USDT information harus terisi
    const isUSDTValid = userUSDTInfo?.usdt_network && userUSDTInfo?.usdt_address;

    return isAmountValid && isUSDTValid;
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

      {/* Tampilkan info USDT user jika ada */}
      {userUSDTInfo && userUSDTInfo.usdt_address && (
        <div className="user-usdt-info">
          <h3>Your Current USDT Information</h3>
          <div className="usdt-details">
            <p><strong>Network:</strong> {userUSDTInfo.usdt_network || 'Not set'}</p>
            <p><strong>Address:</strong> {userUSDTInfo.usdt_address}</p>
            <button 
              className="btn-change-usdt"
              onClick={() => setShowAddUSDT(!showAddUSDT)}
            >
              {showAddUSDT ? 'Cancel' : 'Change USDT'}
            </button>
          </div>
        </div>
      )}

      {/* Form untuk menambah/ubah USDT */}
      {showAddUSDT && (
        <div className="add-usdt-form">
          <h3>{userUSDTInfo?.usdt_address ? 'Change USDT Information' : 'Add USDT Information'}</h3>
          <div className="form-group">
            <label>Select Network</label>
            <select
              value={newUSDTNetwork}
              onChange={(e) => setNewUSDTNetwork(e.target.value)}
              className="currency-select"
            >
              {availableCurrencies.map((curr) => (
                <option key={curr.value} value={curr.value}>
                  {curr.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>USDT Wallet Address</label>
            <input
              type="text"
              placeholder="Enter your USDT wallet address"
              value={newUSDTAddress}
              onChange={(e) => setNewUSDTAddress(e.target.value)}
              className="usdt-address-input"
            />
          </div>
          <div className="form-buttons">
            <button 
              className="btn-cancel"
              onClick={() => setShowAddUSDT(false)}
            >
              Cancel
            </button>
            <button 
              className="btn-save"
              onClick={saveNewUSDT}
              disabled={!newUSDTAddress}
            >
              Save USDT
            </button>
          </div>
        </div>
      )}

      {/* Jika user belum punya USDT, tampilkan tombol untuk menambah */}
      {!userUSDTInfo?.usdt_address && !showAddUSDT && (
        <div className="no-usdt-info">
          <p>You haven't set up your USDT information yet.</p>
          <button 
            className="btn-add-usdt"
            onClick={() => setShowAddUSDT(true)}
          >
            Add USDT Information
          </button>
        </div>
      )}

      {/* Warning jika USDT information belum lengkap */}
      {(!userUSDTInfo?.usdt_network || !userUSDTInfo?.usdt_address) && !showAddUSDT && (
        <div className="usdt-warning">
          <p>⚠️ You must set up your USDT information before you can top up.</p>
        </div>
      )}

      {/* Nominal Section */}
      <div className="nominal-section">
        <h3>Choose Nominal</h3>

        <div className="nominal-grid">
          {amounts.map((item, index) => (
            <div
              key={item.id || index}
              className={`nominal-card ${selected === index ? "selected" : ""} ${
                customAmount ? "deselected" : ""
              }`}
              onClick={() => handleSelectAmount(index)}
            >
              {item.best === 1 && <div className="best-badge">BEST</div>}
              <div className="amount">${item.value}</div>
              <div className="credits">Get {item.credits} credits</div>
            </div>
          ))}
        </div>

        {/* Custom input */}
        <div className={`custom-input ${selected !== null ? "deselected" : ""}`}>
          <label>Input Another Nominal</label>
          <input
            type="number"
            placeholder="More than $20,00..."
            value={customAmount}
            onChange={handleCustomAmountChange}
            onFocus={handleCustomInputFocus}
            onClick={handleCustomInputClick}
          />
        </div>

        <p className="info-text">ⓘ Every $1 will get 100 credits</p>
        
        {/* Info requirements */}
        <div className="requirements-info">
          <p>Requirements to proceed:</p>
          <ul>
            <li className={userUSDTInfo?.usdt_network && userUSDTInfo?.usdt_address ? "requirement-met" : "requirement-not-met"}>
              ✓ USDT information set up
            </li>
            <li className={(selected !== null && amounts[selected]?.value >= 20) || (customAmount && parseFloat(customAmount) >= 20) ? "requirement-met" : "requirement-not-met"}>
              ✓ Minimum amount $20.00
            </li>
          </ul>
        </div>

        <button
          className="confirm-btn"
          disabled={!isFormValid()}
          onClick={handleConfirm}
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

export default TopUpCredit;