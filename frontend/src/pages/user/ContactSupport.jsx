import React, { useState, useEffect } from "react";
import { createTicket, fetchApi } from "../../utils/api";  // tambahkan fetchApi
import "../../style/user/ContactSupport.css";

export default function ContactSupport() {
  const [form, setForm] = useState({
    fullName: "Tio Ramdan",
    email: "tioramdan@gmail.com",
    problem: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ✅ Tambahkan state contacts
  const [contacts, setContacts] = useState([]);

  // ✅ Load contacts dari backend
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const data = await fetchApi("/support"); // GET dari API
        setContacts(data || []);
      } catch (err) {
        console.error("Failed to load contacts:", err);
      }
    };
    loadContacts();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    const ticketData = {
      subject: form.problem,
      message: form.problem,
      email: form.email,
      name: form.fullName,
    };

    try {
      const response = await createTicket(ticketData);  // Memanggil createTicket
      if (response.success) {
        setSuccessMessage("Your ticket has been submitted successfully!");
        setForm({ fullName: "", email: "", problem: "" }); // Reset form setelah submit
      }
    } catch (err) {
      setError("There was an error submitting your ticket.");
      console.error("Ticket creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-support-container">
      <h2 className="page-title">Contact Support</h2>

      <div className="contact-grid">
        {/* Left Form */}
        <div className="support-card">
          <h3 className="section-title">Tell Your Problem</h3>

          <form onSubmit={handleSubmit} className="support-form">
            <div className="form-group">
              <label>Full Name <span>*</span></label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Email <span>*</span></label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label>Problem <span>*</span></label>
              <textarea
                name="problem"
                placeholder="Type problem description here..."
                maxLength="2000"
                value={form.problem}
                onChange={handleChange}
              ></textarea>
              <small>Max. 2,000 characters</small>
            </div>

            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}

            <button type="submit" className="btn-send" disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

        {/* Right Contact Info */}
<div className="contact-info">
  {contacts.filter(c => c.is_active === 1).map((c) => (
    <div className="info-box" key={c.id}>
      <h4>{c.label}</h4>
      <p>{c.description}</p>
      <a
        href={
          c.type === "email" ? `mailto:${c.value}` :
          c.type === "whatsapp" ? `https://wa.me/${c.value.replace(/\D/g, '')}` :
          c.value
        }
        className="info-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        {c.value} ↗
      </a>
    </div>
  ))}
</div>
      </div>
    </div>
  );
}
