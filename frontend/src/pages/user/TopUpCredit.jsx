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
  const [generating, setGenerating] = useState(false);
  const [adminWalletInfo, setAdminWalletInfo] = useState(null);
  const navigate = useNavigate();

  // Available currencies
  const availableCurrencies = [
    { value: "TRC20", label: "USDT-TRC20" },
    { value: "ERC20", label: "USDT-ERC20" },
    { value: "BEP20", label: "USDT-BEP20" }
  ];

  // Fungsi untuk mendapatkan admin wallet berdasarkan network
  const getAdminWalletByNetwork = (network) => {
    if (!adminWalletInfo) return null;
    
    return adminWalletInfo.find(wallet => 
      wallet.network === network && wallet.is_default === 1
    );
  };

  // Fungsi untuk memformat alamat wallet
  const formatWalletAddress = (address) => {
    if (!address) return "Not Available";
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
  };

  // Ambil data nominal, info USDT user, dan info wallet admin dari backend
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load amounts
        const amountsRes = await fetchApi("/deposits/admin/amounts");
        setAmounts(amountsRes.data || []);
        
        // Load user USDT info
        const usdtInfoRes = await fetchApi("/deposits/user/usdt-info");
        setUserUSDTInfo(usdtInfoRes.data);
        
        // Load admin wallet info untuk network yang tersedia
        const walletInfoRes = await fetchApi("/deposits/admin/wallets/user");
        if (walletInfoRes.success) {
          setAdminWalletInfo(walletInfoRes.data);
        }
        
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

  // Handle input custom amount - biarkan user mengetik dengan bebas
  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    
    // Hanya izinkan angka, titik desimal, dan menghapus nol di depan
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setCustomAmount(value);
      setSelected(null); // Reset selected card ketika input custom amount
    }
  };

  // Format dengan 2 desimal saat input kehilangan fokus
  const handleCustomAmountBlur = (e) => {
    let value = e.target.value;
    
    if (value) {
      // Pastikan nilai adalah angka yang valid
      const numValue = parseFloat(value);
      
      if (!isNaN(numValue)) {
        // Format ke 2 desimal
        const formattedValue = numValue.toFixed(2);
        setCustomAmount(formattedValue);
      } else {
        // Jika tidak valid, reset ke string kosong
        setCustomAmount("");
      }
    }
  };

  // Handle focus pada input custom (reset selected card)
  const handleCustomInputFocus = () => {
    setSelected(null);
  };

  // Handle klik pada area custom input (reset selected card)
  const handleCustomInputClick = () => {
    setSelected(null);
  };

  const handleConfirm = async () => {
    let amountValue;

    if (selected !== null && amounts[selected]) {
      amountValue = parseFloat(amounts[selected].value);
    } else {
      amountValue = parseFloat(customAmount);
    }

    console.log("Amount value:", amountValue, "Type:", typeof amountValue);

    // Validasi minimal $10
    if (isNaN(amountValue) || amountValue < 10) {
      alert("Minimum top up is $10.00");
      return;
    }

    // Validasi USDT information
    if (!userUSDTInfo?.usdt_network || !userUSDTInfo?.usdt_address) {
      alert("Please set up your USDT information first");
      return;
    }

    setGenerating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/deposits/generate-address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          network: currency,
          amount: amountValue
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Simpan semua data ke localStorage
        localStorage.setItem("depositData", JSON.stringify(data));
        localStorage.setItem("topupAmount", amountValue.toString());
        localStorage.setItem("topupCurrency", currency);
        localStorage.setItem("topupCredit", data.credit.toString());
        localStorage.setItem("deposit_id", data.deposit_id.toString());
        
        // Pindah ke step berikutnya
        navigate("/deposits/topup2");
      } else {
        alert(data.error || "Failed to generate deposit address");
      }
    } catch (err) {
      console.error("Error generating address:", err);
      alert("Error generating deposit address");
    } finally {
      setGenerating(false);
    }
  };

  // Fungsi untuk mengecek apakah form valid
  const isFormValid = () => {
    let amountValue;

    if (selected !== null && amounts[selected]) {
      amountValue = parseFloat(amounts[selected].value);
    } else {
      amountValue = parseFloat(customAmount);
    }

    // Validasi amount minimal $10
    const isAmountValid = !isNaN(amountValue) && amountValue >= 10;
    
    // Validasi USDT information harus terisi
    const isUSDTValid = userUSDTInfo?.usdt_network && userUSDTInfo?.usdt_address;

    return isAmountValid && isUSDTValid && !generating;
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

      {/* Tampilkan info admin wallet untuk network yang dipilih */}
      {adminWalletInfo && (
        <div className="admin-wallet-info">
          <h3>Recipient Wallet Information</h3>
          <div className="wallet-network-selector">
            <label>Select Network for Transfer:</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="currency-select"
            >
              {availableCurrencies.map((curr) => (
                <option key={curr.value} value={curr.value}>
                  {curr.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="wallet-details">
            <p><strong>Recipient Network:</strong> {currency}</p>
            <p>
              <strong>Recipient Address:</strong> 
              <span className="wallet-address" title={getAdminWalletByNetwork(currency)?.address}>
                {formatWalletAddress(getAdminWalletByNetwork(currency)?.address)}
              </span>
            </p>
            <p className="wallet-note">
              ⚠️ Please ensure you send funds to this exact address on the {currency} network
            </p>
          </div>
        </div>
      )}

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
            type="text" // Menggunakan type="text" agar lebih mudah mengontrol format
            placeholder="More than $10.00..."
            value={customAmount}
            onChange={handleCustomAmountChange}
            onBlur={handleCustomAmountBlur} // Format saat kehilangan fokus
            onFocus={handleCustomInputFocus}
            onClick={handleCustomInputClick}
          />
        </div>
        
        {/* Info requirements */}
        <div className="requirements-info">
          <p>Requirements to proceed:</p>
          <ul>
            <li className={userUSDTInfo?.usdt_network && userUSDTInfo?.usdt_address ? "requirement-met" : "requirement-not-met"}>
              ✓ USDT information set up
            </li>
            <li className={(selected !== null && parseFloat(amounts[selected]?.value) >= 10) || (customAmount && parseFloat(customAmount) >= 10) ? "requirement-met" : "requirement-not-met"}>
              ✓ Minimum amount $10.00
            </li>
          </ul>
        </div>

        <button
          className="confirm-btn"
          disabled={!isFormValid()}
          onClick={handleConfirm}
        >
          {generating ? "Generating Address..." : "Confirm"}
        </button>
      </div>
    </div>
  );
};

export default TopUpCredit;