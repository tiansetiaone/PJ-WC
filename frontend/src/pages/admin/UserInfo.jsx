import React, { useState } from "react";
import "../../style/admin/UserInfo.css";
import { fetchApi } from "../../utils/api";

const UserInfo = ({ user, onClose, refreshUsers }) => {
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  // Approve
  const handleApprove = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/auth/admin/verify-user`, {
        method: "POST",
        body: { user_id: user.id, action: "approve" },
      });

      if (res.success) {
        alert(res.message || "User approved successfully");
        refreshUsers && refreshUsers();
        onClose();
      } else {
        alert(res.error || "Failed to approve user");
      }
    } catch (err) {
      alert("Failed to approve user: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Block
  const handleBlock = async () => {
    const reason = prompt("Enter block reason:", "Blocked by admin");
    if (!reason) return;
    try {
      setLoading(true);
      const res = await fetchApi(`/auth/admin/verify-user`, {
        method: "POST",
        body: { user_id: user.id, action: "block", reason },
      });

      if (res.success) {
        alert(res.message || "User blocked successfully");
        refreshUsers && refreshUsers();
        onClose();
      } else {
        alert(res.error || "Failed to block user");
      }
    } catch (err) {
      alert("Failed to block user: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset Password
  const handleReset = async () => {
    if (!window.confirm(`Reset password for ${user.name}?`)) return;
    try {
      setLoading(true);
      await fetchApi(`/auth/admin/reset-password`, {
        method: "POST",
        body: { user_id: user.id },
      });
      alert(`Password ${user.name} telah direset. Password baru dikirim ke email.`);
    } catch (err) {
      alert("Failed to reset password: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete User
  const handleDelete = async () => {
    if (!window.confirm(`Delete user ${user.name}?`)) return;
    try {
      setLoading(true);
      await fetchApi(`/auth/admin/users/${user.id}`, {
        method: "DELETE",
      });
      alert("User deleted successfully");
      refreshUsers && refreshUsers();
      onClose();
    } catch (err) {
      alert("Failed to delete user: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-info-overlay">
      <div className="user-info-container">
        <div className="user-info-card">
          <h2 className="section-title">User Info</h2>

          <div className="user-data">
            <h3 className="sub-title">User Data</h3>
            <div className="data-grid">
              <div className="data-label">Full Name</div>
              <div className="data-value">{user.name}</div>

              <div className="data-label">Username</div>
              <div className="data-value">{user.username || "-"}</div>

              <div className="data-label">WhatsApp Number</div>
              <div className="data-value">{user.phone || "-"}</div>

              <div className="data-label">Wallet Address</div>
              <div className="data-value">
                {user.walletAddress || "-"} <span className="eye-icon">👁</span>
              </div>

              <div className="data-label">Email</div>
              <div className="data-value">{user.email}</div>

              <div className="data-label">Register Channel</div>
              <div className="data-value">{user.registerChannel || "-"}</div>

              <div className="data-label">Register Date</div>
              <div className="data-value">
                {user.date ? new Date(user.date).toLocaleDateString() : "-"}
              </div>

              <div className="data-label">Status</div>
              <div className="data-value">
                <span className="status-checking">{user.status}</span>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn back" onClick={onClose} disabled={loading}>
              Back
            </button>
            <button className="btn block" onClick={handleBlock} disabled={loading}>
              Block
            </button>
            <button className="btn reset" onClick={handleReset} disabled={loading}>
              Reset Password
            </button>
            <button className="btn approve" onClick={handleApprove} disabled={loading}>
              Approve
            </button>
            <button className="btn delete" onClick={handleDelete} disabled={loading}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
