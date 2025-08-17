import React, { useState } from "react";
import "./ContactSupport.css";

export default function ContactSupport() {
  const [form, setForm] = useState({
    fullName: "Tio Ramdan",
    email: "tioramdan@gmail.com",
    problem: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(form);
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

            <button type="submit" className="btn-send" disabled>
              Send Message
            </button>
          </form>
        </div>

        {/* Right Contact Info */}
        <div className="contact-info">
          <div className="info-box">
            <h4>Email</h4>
            <p>We'll respond within 24 hours.</p>
            <a href="mailto:contact@blasterc.id" className="info-link">
              contact@blasterc.id ↗
            </a>
          </div>

          <div className="info-box">
            <h4>WhatsApp</h4>
            <p>Mon–Fri from 9am to 6pm.</p>
            <a href="https://wa.me/6282234567890" className="info-link">
              +62 822-3456-7890 ↗
            </a>
          </div>

          <div className="info-box">
            <h4>Telegram</h4>
            <p>Mon–Fri from 9am to 6pm.</p>
            <a href="#" className="info-link">
              +62 822-3456-7890 ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
