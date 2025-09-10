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
  const [userUSDTAddresses, setUserUSDTAddresses] = useState([]);
  const [selectedUSDT, setSelectedUSDT] = useState(null);
  const [showAddUSDT, setShowAddUSDT] = useState(false);
  const [newUSDTNetwork, setNewUSDTNetwork] = useState("TRC20");
  const [newUSDTAddress, setNewUSDTAddress] = useState("");
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [adminWalletInfo, setAdminWalletInfo] = useState(null);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showEditUSDT, setShowEditUSDT] = useState(false);
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

  // Ambil data dari backend
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load amounts
        const amountsRes = await fetchApi("/deposits/admin/amounts");
        setAmounts(amountsRes.data || []);
        
        // Load user USDT addresses (multiple)
        const usdtAddressesRes = await fetchApi("/deposits/user/usdt-addresses");
        setUserUSDTAddresses(usdtAddressesRes.data || []);
        
        // Set default selected USDT
        const defaultAddress = usdtAddressesRes.data.find(addr => addr.is_default);
        if (defaultAddress) {
          setSelectedUSDT(defaultAddress);
          setCurrency(defaultAddress.network);
        } else if (usdtAddressesRes.data.length > 0) {
          setSelectedUSDT(usdtAddressesRes.data[0]);
          setCurrency(usdtAddressesRes.data[0].network);
        }
        
        // Load admin wallet info
        const walletInfoRes = await fetchApi("/deposits/admin/wallets/user");
        if (walletInfoRes.success) {
          setAdminWalletInfo(walletInfoRes.data);
        }
      } catch (err) {
        console.error("Error fetching data:", err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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

  // Fungsi untuk update USDT address
  const updateUSDTAddress = async (id, network, address, isDefault) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/deposits/user/usdt-addresses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ network, address, is_default: isDefault })
      });

      const data = await response.json();
      if (data.success) {
        // Reload USDT addresses
        const usdtAddressesRes = await fetchApi("/deposits/user/usdt-addresses");
        setUserUSDTAddresses(usdtAddressesRes.data || []);
        alert("USDT address updated successfully!");
        setShowEditUSDT(false);
        setEditingAddress(null);
      } else {
        alert(data.error || "Failed to update USDT address");
      }
    } catch (error) {
      console.error('Error updating address:', error);
      alert("Error updating USDT address");
    }
  };

  // Fungsi untuk menghapus USDT address
  const deleteUSDTAddress = async (id) => {
    if (!window.confirm("Are you sure you want to delete this USDT address?")) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/deposits/user/usdt-addresses/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        // Reload USDT addresses
        const usdtAddressesRes = await fetchApi("/deposits/user/usdt-addresses");
        setUserUSDTAddresses(usdtAddressesRes.data || []);
        
        // Jika yang dihapus adalah yang selected, pilih yang lain
        if (selectedUSDT && selectedUSDT.id === id) {
          if (usdtAddressesRes.data.length > 0) {
            setSelectedUSDT(usdtAddressesRes.data[0]);
            setCurrency(usdtAddressesRes.data[0].network);
          } else {
            setSelectedUSDT(null);
          }
        }
        
        alert("USDT address deleted successfully!");
      } else {
        alert(data.error || "Failed to delete USDT address");
      }
    } catch (err) {
      console.error("Error deleting USDT:", err);
      alert("Error deleting USDT address");
    }
  };

  // Fungsi untuk set default USDT address
  const setDefaultUSDTAddress = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/deposits/user/usdt-addresses/${id}/set-default`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        // Reload USDT addresses
        const usdtAddressesRes = await fetchApi("/deposits/user/usdt-addresses");
        setUserUSDTAddresses(usdtAddressesRes.data || []);
        
        // Update selected address jika perlu
        const newDefault = usdtAddressesRes.data.find(addr => addr.is_default);
        if (newDefault) {
          setSelectedUSDT(newDefault);
          setCurrency(newDefault.network);
        }
        
        alert("USDT address set as default successfully!");
      } else {
        alert(data.error || "Failed to set default USDT address");
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      alert("Error setting default USDT address");
    }
  };

  // Fungsi untuk membuka modal edit
  const handleEditUSDT = (address) => {
    setEditingAddress(address);
    setNewUSDTNetwork(address.network);
    setNewUSDTAddress(address.address);
    setSetAsDefault(address.is_default);
    setShowEditUSDT(true);
  };

  // Fungsi untuk menyimpan USDT address baru
  const saveNewUSDT = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/deposits/user/usdt-addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          network: newUSDTNetwork,
          address: newUSDTAddress,
          is_default: setAsDefault
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Reload USDT addresses
        const usdtAddressesRes = await fetchApi("/deposits/user/usdt-addresses");
        setUserUSDTAddresses(usdtAddressesRes.data || []);
        
        // Set yang baru sebagai selected jika adalah default
        if (setAsDefault) {
          const newAddress = usdtAddressesRes.data.find(addr => addr.id === data.id);
          setSelectedUSDT(newAddress);
          setCurrency(newUSDTNetwork);
        }
        
        setShowAddUSDT(false);
        setNewUSDTAddress("");
        setSetAsDefault(false);
        alert("USDT address added successfully!");
      } else {
        alert(data.error || "Failed to add USDT address");
      }
    } catch (err) {
      console.error("Error saving USDT:", err);
      alert("Error saving USDT address");
    }
  };

  // Handle pemilihan USDT address
  const handleSelectUSDT = (address) => {
    setSelectedUSDT(address);
    setCurrency(address.network);
  };

  // HandleConfirm function
  const handleConfirm = async () => {
    let amountValue;

    if (selected !== null && amounts[selected]) {
      amountValue = parseFloat(amounts[selected].value);
    } else if (customAmount) {
      amountValue = parseFloat(customAmount);
    } else {
      alert("Please select an amount or enter a custom amount");
      return;
    }

    // Validasi minimal $10
    if (isNaN(amountValue) || amountValue < 10) {
      alert("Minimum top up is $10.00");
      return;
    }

    // Validasi USDT information
    if (!selectedUSDT) {
      alert("Please select a USDT address first");
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
          amount: amountValue,
          usdt_address: selectedUSDT.address
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // SIMPAN SEMUA DATA YANG DIPERLUKAN
        localStorage.setItem("depositData", JSON.stringify({
          ...data,
          userUSDTInfo: {
            usdt_network: selectedUSDT.network,
            usdt_address: selectedUSDT.address
          }
        }));
        localStorage.setItem("topupAmount", amountValue.toString());
        localStorage.setItem("topupCurrency", currency);
        localStorage.setItem("topupCredit", data.credit.toString());
        localStorage.setItem("deposit_id", data.deposit_id.toString());
        
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
    
    // Validasi USDT address harus terpilih
    const isUSDTValid = selectedUSDT !== null;

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

      {/* Tampilkan info admin wallet */}
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
          </div>
        </div>
      )}

      {/* Tampilkan USDT addresses user */}
      <div className="user-usdt-section">
        <h3>Your USDT Addresses</h3>
        
      {userUSDTAddresses.length > 0 ? (
  <div className="usdt-addresses-list">
    {userUSDTAddresses.map((address) => (
  (address.is_default || selectedUSDT?.id === address.id) && (
    <div
      key={address.id}
      className={`usdt-address-card ${selectedUSDT?.id === address.id ? "selected" : ""}`}
      onClick={() => handleSelectUSDT(address)}
    >
      <div className="usdt-address-header">
<span className="network-badge">
  {address.network}
</span>
{Boolean(address.is_default) && (
  <span className="default-badge">Default</span>
)}
        <div className="address-actions">
          <button
            className="edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleEditUSDT(address);
            }}
          >
            ✏️
          </button>
          <button
            className="delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              deleteUSDTAddress(address.id);
            }}
          >
            🗑️
          </button>
          {!address.is_default && (
            <button
              className="default-btn"
              onClick={(e) => {
                e.stopPropagation();
                setDefaultUSDTAddress(address.id);
              }}
            >
              ⭐
            </button>
          )}
        </div>
      </div>
      <div className="usdt-address-value">
        {formatWalletAddress(address.address)}
      </div>
    </div>
  )
))}
    
    {/* Dropdown untuk memilih wallet lain yang tidak default */}
    {userUSDTAddresses.filter(addr => !addr.is_default && selectedUSDT?.id !== addr.id).length > 0 && (
      <div className="other-wallets-dropdown">
        <select
          className="wallet-selector"
          onChange={(e) => {
            const selectedId = parseInt(e.target.value);
            const selectedAddress = userUSDTAddresses.find(addr => addr.id === selectedId);
            if (selectedAddress) {
              handleSelectUSDT(selectedAddress);
            }
          }}
          value=""
        >
          <option value="">Select other wallet...</option>
          {userUSDTAddresses
            .filter(addr => !addr.is_default && selectedUSDT?.id !== addr.id)
            .map((address) => (
              <option key={address.id} value={address.id}>
                {address.network} - {formatWalletAddress(address.address)}
              </option>
            ))
          }
        </select>
      </div>
    )}
  </div>
) : (
  <div className="no-usdt-info">
    <p>You haven't added any USDT addresses yet.</p>
  </div>
)}

        <button 
          className="btn-add-usdt"
          onClick={() => setShowAddUSDT(true)}
        >
          + Add New USDT Address
        </button>
      </div>

      {/* Form untuk menambah USDT address */}
      {showAddUSDT && (
        <div className="add-usdt-form">
          <h3>Add New USDT Address</h3>
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
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={setAsDefault}
                onChange={(e) => setSetAsDefault(e.target.checked)}
              />
              Set as default address
            </label>
          </div>
          <div className="form-buttons">
            <button 
              className="btn-cancel"
              onClick={() => {
                setShowAddUSDT(false);
                setNewUSDTAddress("");
                setSetAsDefault(false);
              }}
            >
              Cancel
            </button>
            <button 
              className="btn-save"
              onClick={saveNewUSDT}
              disabled={!newUSDTAddress}
            >
              Save USDT Address
            </button>
          </div>
        </div>
      )}

      {/* Form untuk edit USDT address */}
      {showEditUSDT && editingAddress && (
        <div className="add-usdt-form">
          <h3>Edit USDT Address</h3>
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
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={setAsDefault}
                onChange={(e) => setSetAsDefault(e.target.checked)}
              />
              Set as default address
            </label>
          </div>
          <div className="form-buttons">
            <button 
              className="btn-cancel"
              onClick={() => {
                setShowEditUSDT(false);
                setEditingAddress(null);
                setNewUSDTAddress("");
                setSetAsDefault(false);
              }}
            >
              Cancel
            </button>
            <button 
              className="btn-save"
              onClick={() => updateUSDTAddress(editingAddress.id, newUSDTNetwork, newUSDTAddress, setAsDefault)}
              disabled={!newUSDTAddress}
            >
              Update USDT Address
            </button>
          </div>
        </div>
      )}

      {/* Warning jika belum pilih USDT address */}
      {!selectedUSDT && (
        <div className="usdt-warning">
          <p>⚠️ Please select a USDT address before proceeding.</p>
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
            type="text"
            placeholder="More than $10.00..."
            value={customAmount}
            onChange={handleCustomAmountChange}
            onBlur={handleCustomAmountBlur}
            onFocus={handleCustomInputFocus}
            onClick={handleCustomInputClick}
          />
        </div>
        
        {/* Info requirements */}
        <div className="requirements-info">
          <p>Requirements to proceed:</p>
          <ul>
            <li className={selectedUSDT ? "requirement-met" : "requirement-not-met"}>
              ✓ USDT address selected
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