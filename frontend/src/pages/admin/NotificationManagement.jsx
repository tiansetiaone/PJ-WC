// src/pages/admin/NotificationManagement.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../style/admin/NotificationManagement.css";
import { getAllNotifications, deleteNotification, updateNotification } from "../../services/notificationService";
import NotificationInfo from "./NotificationInfo";

export default function NotificationManagement() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // ✅ State untuk update modal
  const [editingNotification, setEditingNotification] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    user_scope: "all",
    recipient_id: null,
  });

  // ✅ State untuk filter dan search
  const [searchText, setSearchText] = useState("");
  const [timeFilter, setTimeFilter] = useState("");

  const handleCreateNotification = () => {
    navigate("/admin/create/notifications");
  };

  // 🗑️ Delete handler
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err.message);
      alert("Failed to delete notification");
    }
  };

  // ✏️ Update handler → buka modal & prefill
  const handleEdit = (notif) => {
    setEditingNotification(notif);
    setEditForm({
      title: notif.title || "",
      content: notif.content || "",
      user_scope: notif.user_scope || "all",
      recipient_id: notif.recipient_id ?? null,
    });
  };

  // 📌 Submit update
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedNotif = await updateNotification(editingNotification.id, {
        title: editForm.title,
        content: editForm.content,
        user_scope: editForm.user_scope,
        recipient_id: editForm.user_scope === "user" ? (editForm.recipient_id || null) : null,
      });

      // sinkronkan list di state
      setNotifications((prev) =>
        prev.map((n) => (n.id === editingNotification.id ? { ...n, ...updatedNotif } : n))
      );
      setEditingNotification(null); // tutup modal
    } catch (err) {
      console.error("Failed to update notification:", err.message);
      alert("Failed to update notification");
    }
  };

  // ✅ Fetch data dari backend
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        const data = await getAllNotifications();
        // Tambahkan rawDate untuk filtering
        const notificationsWithRawDate = data.map(notif => ({
          ...notif,
          rawDate: new Date(notif.created_at)
        }));
        setNotifications(notificationsWithRawDate);
      } catch (error) {
        console.error("Failed to fetch notifications:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // ✅ Filter notifications berdasarkan search dan time filter
  const filteredNotifications = notifications.filter(notif => {
    // Search filter
    const matchesSearch = searchText === "" || 
      notif.title.toLowerCase().includes(searchText.toLowerCase()) ||
      notif.content.toLowerCase().includes(searchText.toLowerCase());
    
    // Time filter
    const now = new Date();
    let matchesTimeFilter = true;
    
    if (timeFilter === "Today") {
      matchesTimeFilter = 
        notif.rawDate.getUTCDate() === now.getUTCDate() &&
        notif.rawDate.getUTCMonth() === now.getUTCMonth() &&
        notif.rawDate.getUTCFullYear() === now.getUTCFullYear();
    } else if (timeFilter === "This Week") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      matchesTimeFilter = notif.rawDate >= oneWeekAgo;
    } else if (timeFilter === "This Month") {
      matchesTimeFilter = 
        notif.rawDate.getUTCMonth() === now.getUTCMonth() && 
        notif.rawDate.getUTCFullYear() === now.getUTCFullYear();
    }
    
    return matchesSearch && matchesTimeFilter;
  });

  if (loading) {
    return <p className="loading">Loading notifications...</p>;
  }

  return (
    <div className="notification-container-management">
      <div className="notification-header">
        <h2>Notification Management</h2>
        <button className="btn-create" onClick={handleCreateNotification}>
          + Create New Notification
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="notification-box">
          <h2>Notification History</h2>
          <div className="empty-state">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
              alt="empty"
            />
            <h3>No Notification History Yet</h3>
            <p>
              There are no notifications recorded yet. Once you create and send
              a new update, it will appear here for users to view.
            </p>
          </div>
        </div>
      ) : (
        <div className="notification-table">
          <div className="table-header">
            <input 
              type="text" 
              placeholder="Search by title or message..." 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            >
              <option value="">All Time</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <img
                src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
                alt="empty"
              />
              <h3 className="empty-title">
                {searchText || timeFilter ? "No matching results" : "No Notifications Yet"}
              </h3>
              <p className="empty-subtitle">
                {searchText || timeFilter 
                  ? "Try adjusting your search or filter criteria" 
                  : "There are no notifications recorded yet."}
              </p>
            </div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Title</th>
                    <th>Message</th>
                    <th>Publish Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotifications.map((notif, index) => (
                    <tr key={notif.id} className="row-clickable">
                      <td>{index + 1}</td>
                      <td onClick={() => setSelectedNotification(notif)}>
                        {notif.title}
                      </td>
                      <td onClick={() => setSelectedNotification(notif)}>
                        {notif.content}
                      </td>
                      <td onClick={() => setSelectedNotification(notif)}>
                        {new Date(notif.created_at).toLocaleString()}
                      </td>
                      <td className="actions">
                        <button
                          className="btn-edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(notif);
                          }}
                        >
                          ✏️ Update
                        </button>
                        <button
                          className="btn-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notif.id);
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pagination">
                <p>{filteredNotifications.length} of {notifications.length} data</p>
                <div>
                  <button>{"<"}</button>
                  <button className="active">1</button>
                  <button>{">"}</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ✅ Modal Detail Info */}
      {selectedNotification && (
        <div className="modal-overlay">
          <div className="modal-content-campaign">
            <NotificationInfo
              notification={selectedNotification}
              onClose={() => setSelectedNotification(null)}
            />
          </div>
        </div>
      )}

      {/* ✅ Modal Update Form */}
      {editingNotification && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Update Notification</h3>
            <form onSubmit={handleUpdateSubmit}>
              <label>Title</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                required
              />

              <label>Message</label>
              <textarea
                rows="5"
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                required
              />

              <label>User Scope</label>
              <select
                value={editForm.user_scope}
                onChange={(e) => setEditForm({ ...editForm, user_scope: e.target.value })}
                required
              >
                <option value="all">All</option>
                <option value="admin">Admin</option>
                <option value="user">Specific User</option>
              </select>

              {editForm.user_scope === "user" && (
                <>
                  <label>Recipient ID</label>
                  <input
                    type="number"
                    placeholder="User ID"
                    value={editForm.recipient_id ?? ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        recipient_id: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </>
              )}

              <div className="modal-actions">
                <button type="submit" className="btn-edit">Save Changes</button>
                <button type="button" className="btn-delete" onClick={() => setEditingNotification(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}