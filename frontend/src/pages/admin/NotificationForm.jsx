import React, { useState, useEffect } from "react";

export default function NotificationForm({
  initialData = null,
  onSubmit,
  loading,
  error,
}) {
  const [title, setTitle] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [message, setMessage] = useState("");
  const [userScope, setUserScope] = useState("all");

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setPublishDate(initialData.publish_date || "");
      setMessage(initialData.content || "");
      setUserScope(initialData.user_scope || "all");
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      title,
      content: message,
      publish_date: publishDate,
      user_scope: userScope,
      recipient_id: null,
    };
    onSubmit(payload);
  };

  return (
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
        <div className="char-counter">{1752 - message.length} characters left</div>
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
          {loading ? "Saving..." : initialData ? "Update Notification" : "Create Notification"}
        </button>
      </div>
    </form>
  );
}
