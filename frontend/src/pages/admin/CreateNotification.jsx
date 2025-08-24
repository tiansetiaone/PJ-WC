import React, { useState } from "react";
import "../../style/admin/CreateNotification.css";
import { createNotification } from "../../services/notificationService";
import { useNavigate } from "react-router-dom";

export default function CreateNotification() {
  const [title, setTitle] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [message, setMessage] = useState("");
  const [userScope, setUserScope] = useState("all"); // default ke "all"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const newNotification = {
        title,
        content: message, // backend expects "content"
        user_scope: userScope,
        recipient_id: null, // bisa tambahin kalau ada field pilih user
        publish_date: publishDate, // kalau memang mau simpan juga
      };

      await createNotification(newNotification);

      // reset form setelah submit
      setTitle("");
      setPublishDate("");
      setMessage("");
      setUserScope("all");

      // redirect balik ke halaman Notification Management
      navigate("/admin/notifications");
    } catch (err) {
      setError("Failed to create notification. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-notification-container">
      <div className="breadcrumb">
        <span>🏠</span> &nbsp; / &nbsp;
        <span>Notification Management</span> &nbsp; / &nbsp;
        <span className="active">Create New Notification</span>
      </div>

      <h2 className="page-title">Create New Notification</h2>

      <form className="notification-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            <span className="required">*</span> Title
          </label>
          <input
            type="text"
            placeholder="Enter title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>
            <span className="required">*</span> Publish Date
          </label>
          <input
            type="date"
            value={publishDate}
            onChange={(e) => setPublishDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>
            <span className="required">*</span> Message
          </label>
          <textarea
            rows="6"
            placeholder="Write your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <div className="char-counter">
            {1752 - message.length} characters left
          </div>
        </div>

        <div className="form-group">
          <label>User Scope</label>
          <select
            value={userScope}
            onChange={(e) => setUserScope(e.target.value)}
          >
            <option value="all">All Users</option>
            <option value="admin">Admins Only</option>
            <option value="user">Specific User</option>
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Creating..." : "Create Notification"}
          </button>
        </div>
      </form>
    </div>
  );
}
