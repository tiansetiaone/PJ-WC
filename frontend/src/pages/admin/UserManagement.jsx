import React, { useEffect, useState } from "react";
import "../../style/admin/UserManagement.css";
import { fetchApi } from "../../utils/api";
import UserInfo from "./UserInfo";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [showEditCreditModal, setShowEditCreditModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [updatingCredit, setUpdatingCredit] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchApi("/auth/admin/users");
      setUsers(data);
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (id) => {
    try {
      const user = await fetchApi(`/auth/admin/users/${id}`);
      setSelectedUser(user);
      setShowModal(true);
    } catch (err) {
      alert("Failed to fetch user detail: " + err.message);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const handleEdit = (id) => {
    const user = users.find((u) => u.id === id);
    setResetUser(user);
    setShowResetModal(true);
  };

  const confirmResetPassword = async () => {
    if (!resetUser) return;
    try {
      await fetchApi(`/auth/admin/reset-password`, {
        method: "POST",
        body: { user_id: resetUser.id },
      });
      alert(`Password ${resetUser.name} telah direset. Password baru dikirim ke email.`);
      setShowResetModal(false);
      setResetUser(null);
    } catch (err) {
      alert("Failed to reset password: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await fetchApi(`/auth/admin/users/${id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== id));
      alert("User deleted successfully");
    } catch (err) {
      alert("Failed to delete user: " + err.message);
    }
  };

  // Approve user
  const handleApprove = async (id) => {
    try {
      const res = await fetchApi(`/auth/admin/verify-user`, {
        method: "POST",
        body: { user_id: id, action: "approve" },
      });

      if (res.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, status: "Register Success" } : u
          )
        );
        alert(res.message || "User approved successfully");
      } else {
        alert(res.error || "Failed to approve user");
      }
    } catch (err) {
      alert("Failed to approve user: " + err.message);
    }
  };

  // Block user
  const handleBlock = async (id) => {
    const reason = prompt("Enter block reason:", "Blocked by admin");
    if (!reason) return;
    try {
      const res = await fetchApi(`/auth/admin/verify-user`, {
        method: "POST",
        body: { user_id: id, action: "block", reason },
      });

      if (res.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, status: "Register Failed" } : u
          )
        );
        alert(res.message || "User blocked successfully");
      } else {
        alert(res.error || "Failed to block user");
      }
    } catch (err) {
      alert("Failed to block user: " + err.message);
    }
  };

  // Handle edit credit
  const handleEditCredit = (user) => {
    setSelectedUser(user);
    setCreditAmount(user.total_credit || "0");
    setShowEditCreditModal(true);
  };

  // Confirm update credit
  const confirmUpdateCredit = async () => {
    if (!selectedUser || !creditAmount) return;
    
    setUpdatingCredit(true);
    try {
      const response = await fetchApi(`/auth/admin/update-credit`, {
        method: "POST",
        body: { 
          user_id: selectedUser.id, 
          credit_amount: parseFloat(creditAmount) 
        },
      });
      
      if (response.success) {
        alert(`Credit untuk ${selectedUser.name} berhasil diupdate.`);
        
        // Refresh data users
        await loadUsers();
        
        setShowEditCreditModal(false);
        setSelectedUser(null);
        setCreditAmount("");
      } else {
        alert(response.error || "Failed to update credit");
      }
    } catch (err) {
      console.error("Update credit error:", err);
      if (err.message.includes("Failed to fetch") || err.message.includes("connection refused")) {
        alert("Cannot connect to server. Please check if backend is running on port 5000.");
      } else {
        alert("Failed to update credit: " + err.message);
      }
    } finally {
      setUpdatingCredit(false);
    }
  };

  // === Filtering logic ===
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "" || statusFilter === "Status" || u.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // === Pagination logic ===
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container">
      <div className="main-content-manage">
        <div className="breadcrumb">› User Management</div>
        <div className="card-manage">
          <h3>Registered Users</h3>

          {loading ? (
            <p>Loading users...</p>
          ) : error ? (
            <div className="empty-state">
              <h4>Error</h4>
              <p>{error}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <img
                src="https://cdn-icons-png.flaticon.com/512/4076/4076505.png"
                alt="empty"
              />
              <h4>No Registered Users Yet</h4>
              <p>There are no users registered yet.</p>
            </div>
          ) : (
            <>
              {/* Filter */}
              <div className="search-filter">
                <input
                  type="text"
                  placeholder="Search user..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">Status</option>
                  <option value="Register Success">Register Success</option>
                  <option value="Register Failed">Register Failed</option>
                  <option value="Checking Register">Checking Register</option>
                </select>
              </div>

              {/* Table */}
              <table>
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>WhatsApp Number</th>
                    <th>Referral Code</th>
                    <th>Credit</th>
                    <th>Status</th>
                    <th>Register Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((u, i) => (
                    <tr key={u.id}>
                      <td>{indexOfFirstUser + i + 1}</td>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.phone || "-"}</td>
                      <td>{u.referral || "-"}</td>
                      <td>{u.total_credit || "0.00"}</td>
                      <td>
                        <span className={`status ${u.status?.toLowerCase()}`}>
                          {u.status}
                        </span>
                      </td>
                      <td>
                        {u.date ? new Date(u.date).toLocaleDateString() : "-"}
                      </td>
                      <td className="actions">
                        <button className="view-user" onClick={() => handleView(u.id)} title="View">👁️</button>
                        
                        <button 
                          className="edit-credit" 
                          onClick={() => handleEditCredit(u)}
                          title="Edit Credit"
                        >💰</button>

                        {u.status === "Register Success" && (
                          <>
                            <button className="edit-user" onClick={() => handleEdit(u.id)} title="Edit">✏️</button>
                            <button className="block-user" onClick={() => handleBlock(u.id)} title="Block">🚫</button>
                            <button className="delete-user" onClick={() => handleDelete(u.id)} title="Delete">❌</button>
                          </>
                        )}

                        {u.status === "Register Failed" && (
                          <>
                            <button className="block-user" onClick={() => handleBlock(u.id)} title="Block">🚫</button>
                            <button className="delete-user" onClick={() => handleDelete(u.id)} title="Delete">❌</button>
                          </>
                        )}

                        {u.status === "Checking Register" && (
                          <>
                            <button className="block-user" onClick={() => handleBlock(u.id)} title="Block">🚫</button>
                            <button className="delete-user" onClick={() => handleDelete(u.id)} title="Delete">❌</button>
                            <button className="approve" onClick={() => handleApprove(u.id)} title="Approve">✔️</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="pagination-user-manage">
                <button
                  onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  {"<"}
                </button>

                {[...Array(totalPages)].map((_, idx) => (
                  <button
                    key={idx + 1}
                    className={currentPage === idx + 1 ? "active" : ""}
                    onClick={() => paginate(idx + 1)}
                  >
                    {idx + 1}
                  </button>
                ))}

                <button
                  onClick={() =>
                    currentPage < totalPages && paginate(currentPage + 1)
                  }
                  disabled={currentPage === totalPages}
                >
                  {">"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Credit Modal */}
      {showEditCreditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Credit</h3>
            <p>
              Edit nominal credit untuk user <b>{selectedUser?.name}</b>
            </p>
            
            <div className="modal-input">
              <label>Jumlah Credit:</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="Masukkan jumlah credit"
                disabled={updatingCredit}
              />
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={() => setShowEditCreditModal(false)}
                disabled={updatingCredit}
              >
                Batal
              </button>
              <button 
                onClick={confirmUpdateCredit}
                disabled={updatingCredit}
              >
                {updatingCredit ? "Updating..." : "Update Credit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Info Modal */}
      {showModal && (
        <UserInfo
          user={selectedUser}
          onClose={handleCloseModal}
          refreshUsers={loadUsers}
        />
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Reset Password</h3>
            <p>
              Anda akan mereset password untuk user <b>{resetUser?.name}</b>. 
              Password baru akan dikirim ke email user.
            </p>
            <div className="modal-actions">
              <button onClick={() => setShowResetModal(false)}>Batal</button>
              <button onClick={confirmResetPassword}>Reset Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;