import React, { useState, useEffect } from "react";
import "../../style/admin/UserInfo.css";
import { fetchApi } from "../../utils/api";

const UserInfo = ({ user, onClose, refreshUsers }) => {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (user) {
      // Jika user sudah memiliki data lengkap, gunakan langsung
      if (user.email && user.name) {
        setUserData(user);
      } else {
        // Jika hanya ada ID, fetch data lengkap
        fetchUserDetails();
      }
    }
  }, [user]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const data = await fetchApi(`/auth/admin/users/${user.id}`);
      setUserData(data);
    } catch (err) {
      console.error("Failed to fetch user details:", err);
      // Fallback: gunakan data yang ada meski tidak lengkap
      setUserData(user);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  // Gunakan userData jika ada, fallback ke user
  const displayUser = userData || user;

  // Fungsi untuk memformat tampilan credit
  const formatCredit = (credit) => {
    if (credit === undefined || credit === null) return "0";
    
    const num = parseFloat(credit);
    if (isNaN(num)) return "0";
    
    if (num === 0) return "0";
    if (num % 1 === 0) return num.toString();
    return num.toFixed(2);
  };

  // Fungsi untuk mendapatkan class status yang sesuai
  const getStatusClass = (status) => {
    if (!status) return "status-checking";
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes("success")) return "status-success";
    if (statusLower.includes("failed")) return "status-failed";
    if (statusLower.includes("checking")) return "status-checking";
    return "status-checking";
  };

  // Fungsi untuk mendapatkan status display
  const getStatusDisplay = (status, isActive, deletedAt) => {
    if (status) return status;
    if (deletedAt) return "Register Failed";
    if (isActive === 1 || isActive === true) return "Register Success";
    return "Checking Register";
  };

  // Approve
  const handleApprove = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/auth/admin/verify-user`, {
        method: "POST",
        body: { user_id: displayUser.id, action: "approve" },
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
        body: { user_id: displayUser.id, action: "block", reason },
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
    if (!window.confirm(`Reset password for ${displayUser.name}?`)) return;
    try {
      setLoading(true);
      await fetchApi(`/auth/admin/reset-password`, {
        method: "POST",
        body: { user_id: displayUser.id },
      });
      alert(`Password ${displayUser.name} telah direset. Password baru dikirim ke email.`);
    } catch (err) {
      alert("Failed to reset password: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete User
  const handleDelete = async () => {
    if (!window.confirm(`Delete user ${displayUser.name}?`)) return;
    try {
      setLoading(true);
      await fetchApi(`/auth/admin/users/${displayUser.id}`, {
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

          {loading ? (
            <div className="loading">Loading user details...</div>
          ) : (
            <div className="user-data">
              <h3 className="sub-title">User Data</h3>
              <div className="data-grid">
                <div className="data-label">Full Name</div>
                <div className="data-value">{displayUser.name || "-"}</div>

                <div className="data-label">Username</div>
                <div className="data-value">{displayUser.username || "-"}</div>

                <div className="data-label">Email</div>
                <div className="data-value">{displayUser.email || "-"}</div>

                <div className="data-label">WhatsApp Number</div>
                <div className="data-value">{displayUser.phone || displayUser.whatsapp_number || "-"}</div>

                <div className="data-label">Referral Code</div>
                <div className="data-value">{displayUser.referral || displayUser.referral_code || "-"}</div>

                <div className="data-label">Provider</div>
                <div className="data-value">{displayUser.provider || "-"}</div>

                <div className="data-label">Total Credit</div>
                <div className="data-value">{formatCredit(displayUser.total_credit)}</div>

                <div className="data-label">Balance</div>
                <div className="data-value">{formatCredit(displayUser.balance)}</div>

                <div className="data-label">Register Date</div>
                <div className="data-value">
                  {displayUser.date || displayUser.created_at 
                    ? new Date(displayUser.date || displayUser.created_at).toLocaleDateString() 
                    : "-"
                  }
                </div>

                <div className="data-label">Verified At</div>
                <div className="data-value">
                  {displayUser.verified_at 
                    ? new Date(displayUser.verified_at).toLocaleDateString() 
                    : "Not Verified"
                  }
                </div>

                <div className="data-label">Status</div>
                <div className="data-value">
                  <span className={`status ${getStatusClass(displayUser.status)}`}>
                    {getStatusDisplay(displayUser.status, displayUser.is_active, displayUser.deleted_at)}
                  </span>
                </div>
              </div>
            </div>
          )}

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