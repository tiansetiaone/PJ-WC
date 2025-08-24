import React, { useEffect, useState } from "react";
import { fetchApi } from "../../utils/api";
import "../../style/admin/ManageDepositAmounts.css";

const ManageDepositAmounts = () => {
  const [amounts, setAmounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ value: "", credits: "", best: false });
  const [editingId, setEditingId] = useState(null);

  // Load data dari backend
  const loadAmounts = async () => {
    try {
      const res = await fetchApi("/deposits/admin/amounts");
      setAmounts(res.data || []);
    } catch (err) {
      console.error("Error loading amounts:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAmounts();
  }, []);

  // Tambah / Update Amount
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await fetchApi(`/deposits/admin/amounts/${editingId}`, "PUT", form);
      } else {
        await fetchApi("/deposits/admin/amounts", "POST", form);
      }
      setForm({ value: "", credits: "", best: false });
      setEditingId(null);
      loadAmounts();
    } catch (err) {
      console.error("Error saving amount:", err.message);
    }
  };

  // Hapus Amount
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this amount?")) return;
    try {
      await fetchApi(`/admin/deposits/amounts/${id}`, "DELETE");
      loadAmounts();
    } catch (err) {
      console.error("Error deleting:", err.message);
    }
  };

  // Edit Amount
  const handleEdit = (amt) => {
    setForm({
      value: amt.value,
      credits: amt.credits,
      best: amt.best,
    });
    setEditingId(amt.id);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="manage-amounts-container">
      <h1 className="title">Manage Deposit Amounts</h1>

      {/* Form Input */}
      <form className="amount-form" onSubmit={handleSubmit}>
        <input
          type="number"
          placeholder="Amount ($)"
          value={form.value}
          onChange={(e) => setForm({ ...form, value: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Credits (ex: 10.000 credits)"
          value={form.credits}
          onChange={(e) => setForm({ ...form, credits: e.target.value })}
          required
        />
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.best}
            onChange={(e) => setForm({ ...form, best: e.target.checked })}
          />
          Mark as Best
        </label>
        <button type="submit" className="btn-submit">
          {editingId ? "Update" : "Add"}
        </button>
      </form>

      {/* List Data */}
      <table className="amounts-table">
        <thead>
          <tr>
            <th>$ Amount</th>
            <th>Credits</th>
            <th>Best</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {amounts.map((amt) => (
            <tr key={amt.id}>
              <td>${amt.value}</td>
              <td>{amt.credits}</td>
              <td>{amt.best ? "✅" : "—"}</td>
              <td>
                <button className="btn-edit" onClick={() => handleEdit(amt)}>Edit</button>
                <button className="btn-delete" onClick={() => handleDelete(amt.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageDepositAmounts;
