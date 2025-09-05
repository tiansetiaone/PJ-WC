import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../style/admin/DepositAmountsPg.css";

export default function DepositManagementPage() {
  const [deposits, setDeposits] = useState([]);
  const [form, setForm] = useState({ id: null, value: "", credits: "", best: false });
  const [isEditing, setIsEditing] = useState(false);

  // Set authorization header dengan token
  const getAuthHeader = () => {
    const token = localStorage.getItem("token"); // Ambil token dari localStorage
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    };
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/deposits/admin/amounts",
        getAuthHeader()
      );
      setDeposits(res.data.data); // Akses data dari response
    } catch (err) {
      console.error("Error fetching deposits:", err);
      alert("Gagal mengambil data deposit amounts");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(
          `http://localhost:5000/api/deposits/admin/amounts/${form.id}`,
          form,
          getAuthHeader()
        );
      } else {
        await axios.post(
          "http://localhost:5000/api/deposits/admin/amounts",
          form,
          getAuthHeader()
        );
      }
      setForm({ id: null, value: "", credits: "", best: false });
      setIsEditing(false);
      fetchDeposits();
      alert(isEditing ? "Deposit amount berhasil diupdate" : "Deposit amount berhasil dibuat");
    } catch (err) {
      console.error("Error submitting form:", err);
      alert("Gagal menyimpan data");
    }
  };

  const handleEdit = (item) => {
    setForm({
      id: item.id,
      value: item.value,
      credits: item.credits,
      best: item.best === 1 || item.best === true // Handle boolean atau integer
    });
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus?")) return;
    try {
      await axios.delete(
        `http://localhost:5000/api/deposits/admin/amounts/${id}`,
        getAuthHeader()
      );
      fetchDeposits();
      alert("Deposit amount berhasil dihapus");
    } catch (err) {
      console.error("Error deleting deposit:", err);
      alert("Gagal menghapus data");
    }
  };

  return (
    <div className="deposit-container">
      <h1 className="deposit-title">Deposit Amount Management</h1>

      {/* Form */}
      <form className="deposit-form" onSubmit={handleSubmit}>
        <input
          type="number"
          placeholder="Value (USDT)"
          value={form.value}
          onChange={(e) => setForm({ ...form, value: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Credits"
          value={form.credits}
          onChange={(e) => setForm({ ...form, credits: e.target.value })}
          required
        />
        <label className="deposit-checkbox">
          <input
            type="checkbox"
            checked={form.best}
            onChange={(e) => setForm({ ...form, best: e.target.checked })}
          />
          Best Offer
        </label>
        <button type="submit" className="submit-btn">
          {isEditing ? "Update Deposit" : "Create Deposit"}
        </button>
      </form>

      {/* List */}
      <div className="deposit-list">
        {deposits.map((item) => (
          <div key={item.id} className="deposit-card">
            <div className="deposit-info">
              <p className="deposit-value">${item.value} USDT</p>
              <p className="deposit-credits">{item.credits}</p>
              {(item.best === 1 || item.best === true) && <span className="deposit-best">Best Offer</span>}
            </div>
            <div className="deposit-actions">
              <button className="edit-btn" onClick={() => handleEdit(item)}>
                Edit
              </button>
              <button className="delete-btn" onClick={() => handleDelete(item.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}