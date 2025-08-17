import React, { useState } from "react";
import "./EditProfile.css";

export default function EditProfile() {
  const [form, setForm] = useState({
    fullName: "Tio Ramdan",
    username: "tioramdan",
    whatsapp: "+62 80123456789",
    email: "tioramdan@gmail.com",
    wallet: "TPAgkYf2RdK83docc4xgEvVu4jPKfeuer5",
    timezone: "",
    password: "********",
    confirmPassword: "********",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="edit-profile-container">
      <h2 className="page-title">Edit Profile</h2>

      <div className="edit-profile-card">
        <div className="profile-photo-section">
          <div className="avatar">TR</div>
          <p className="file-info">Allowed files: JPEG/JPG/PNG (1 MB)</p>
          <button className="btn-delete-photo">Delete Photo</button>
        </div>

        <form className="profile-form">
          <div className="form-group">
            <label>Full Name <span>*</span></label>
            <input type="text" name="fullName" value={form.fullName} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Username <span>*</span></label>
            <input type="text" name="username" value={form.username} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>WhatsApp Number <span>*</span></label>
            <input type="text" name="whatsapp" value={form.whatsapp} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>USDT TRC20 Wallet Address <span>*</span></label>
            <input type="text" name="wallet" value={form.wallet} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Email <span>*</span></label>
            <input type="email" name="email" value={form.email} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Timezone (Optional)</label>
            <select name="timezone" value={form.timezone} onChange={handleChange}>
              <option value="">Select timezone..</option>
              <option value="GMT+7">GMT+7</option>
              <option value="GMT+8">GMT+8</option>
            </select>
          </div>

          <div className="form-group">
            <label>Password <span>*</span></label>
            <input type="password" name="password" value={form.password} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Password Confirmation <span>*</span></label>
            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} />
          </div>

          <button type="submit" className="btn-save" disabled>Save Changes</button>
        </form>
      </div>
    </div>
  );
}
