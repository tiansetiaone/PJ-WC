import React, { useState, useEffect } from "react";
import { fetchApi } from "../../utils/api";
import "../../style/admin/ContactSettingsModal.css";

export default function ContactSettingsModal({ onClose }) {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({
    type: "email",
    label: "",
    value: "",
    description: "",
  });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    const data = await fetchApi("/support"); // API GET kontak
    setContacts(data || []);
  };

  const handleSave = async () => {
    if (form.id) {
      // Update
      await fetchApi(`/support/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      // Create
      await fetchApi("/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setForm({ type: "email", label: "", value: "", description: "" });
    loadContacts();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      await fetchApi(`/support/${id}`, { method: "DELETE" });
      loadContacts();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Manage Contact & Social Media</h3>
        <button className="modal-close" onClick={onClose}>
          ✖
        </button>

        {/* Form Tambah Kontak */}
        <div className="contact-form">
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="telegram">Telegram</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="twitter">Twitter</option>
          </select>
          <input
            type="text"
            placeholder="Label"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
          />
          <input
            type="text"
            placeholder="Value (URL / Email / Number)"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
          />
          <input
            type="text"
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />
          <button onClick={handleSave}>
            {form.id ? "Update Contact" : "Add Contact"}
          </button>
        </div>

        {/* Daftar Kontak */}
        <ul className="contact-list">
          {contacts.map((c) => (
            <li key={c.id} className="contact-item">
              <div className="contact-info">
                <strong>{c.label}</strong> — {c.value} <br />
                <small>{c.description}</small>
              </div>
              <div className="contact-actions">
                <label>
                  <input
                    type="checkbox"
                    checked={c.is_active === 1}
                    onChange={async (e) => {
                      await fetchApi(`/support/${c.id}/active`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          is_active: e.target.checked ? 1 : 0,
                        }),
                      });
                      loadContacts();
                    }}
                  />
                  Show on frontend
                </label>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(c.id)}
                >
                  🗑 Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
