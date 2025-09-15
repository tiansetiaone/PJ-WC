const db = require("../config/db");

// GET for user & admin (shared endpoint)
exports.getNotifications = async (req, res) => {
  const role = req.user.role; // 'user' atau 'admin'
  try {
    const [rows] = await db.query(`SELECT * FROM notifications WHERE user_scope = 'all' OR user_scope = ? ORDER BY created_at DESC`, [role]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST create new notification (admin only)
exports.createNotification = async (req, res) => {
  const { title, content, user_scope, recipient_id } = req.body;

  // Validasi input
  if (!title || !content || !user_scope) {
    return res.status(400).json({
      error: "Missing required fields",
      required: ["title", "content", "user_scope"],
    });
  }

  // Validasi user_scope
  if (!["all", "user", "admin"].includes(user_scope)) {
    return res.status(400).json({
      error: "Invalid user_scope",
      details: "Allowed values: all, user, admin",
    });
  }

  // Jika scope adalah user tertentu, validasi recipient_id
  if (user_scope === "user" && !recipient_id) {
    return res.status(400).json({
      error: "recipient_id is required when user_scope is 'user'",
    });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO notifications 
       (title, content, user_scope, created_by, recipient_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [title, content, user_scope, req.user.id, recipient_id || null]
    );

    // Dapatkan notifikasi yang baru dibuat untuk response
    const [newNotification] = await db.query(
      `SELECT n.*, u.username as created_by_username 
       FROM notifications n
       LEFT JOIN users u ON n.created_by = u.id
       WHERE n.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      notification: newNotification[0],
    });
  } catch (err) {
    res.status(500).json({
      error: "Database error",
      details: process.env.NODE_ENV === "development" ? err.message : null,
    });
  }
};

// GET all notifications (admin only)
exports.getAllNotifications = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT n.*, u.username as created_by_username 
      FROM notifications n
      LEFT JOIN users u ON n.created_by = u.id
      ORDER BY n.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET notification by ID
exports.getNotificationById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT n.*, u.username as created_by_username 
      FROM notifications n
      LEFT JOIN users u ON n.created_by = u.id
      WHERE n.id = ?
    `,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT update notification (admin only)
exports.updateNotification = async (req, res) => {
  const { title, content, user_scope, recipient_id } = req.body;
  const notificationId = req.params.id;

  // Validasi input
  if (!title || !content || !user_scope) {
    return res.status(400).json({
      error: "Missing required fields",
      required: ["title", "content", "user_scope"],
    });
  }

  try {
    // Cek apakah notifikasi ada
    const [existing] = await db.query(`SELECT id FROM notifications WHERE id = ?`, [notificationId]);

    if (existing.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    // Update notifikasi
    await db.query(
      `UPDATE notifications 
       SET title = ?, content = ?, user_scope = ?, recipient_id = ?
       WHERE id = ?`,
      [title, content, user_scope, recipient_id || null, notificationId]
    );

    // Dapatkan notifikasi yang telah diupdate untuk response
    const [updatedNotification] = await db.query(
      `SELECT n.*, u.username as created_by_username 
       FROM notifications n
       LEFT JOIN users u ON n.created_by = u.id
       WHERE n.id = ?`,
      [notificationId]
    );

    res.json({
      success: true,
      message: "Notification updated successfully",
      notification: updatedNotification[0],
    });
  } catch (err) {
    res.status(500).json({
      error: "Database error",
      details: process.env.NODE_ENV === "development" ? err.message : null,
    });
  }
};

// DELETE notification (admin only)
exports.deleteNotification = async (req, res) => {
  try {
    const [result] = await db.query(`DELETE FROM notifications WHERE id = ?`, [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH mark as read
exports.markAsRead = async (req, res) => {
  try {
    const [result] = await db.query(`UPDATE notifications SET is_read = 1 WHERE id = ? AND (recipient_id = ? OR user_scope IN ('all', ?))`, [req.params.id, req.user.id, req.user.role]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ success: true, message: "Notification marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    const [result] = await db.query(
      `UPDATE notifications 
       SET is_read = 1 
       WHERE (recipient_id = ? OR user_scope IN ('all', ?))`,
      [req.user.id, req.user.role]
    );

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// GET unread notifications count
exports.getUnreadCount = async (req, res) => {
  const role = req.user.role;
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count 
       FROM notifications 
       WHERE is_read = 0 AND (user_scope = 'all' OR user_scope = ? OR recipient_id = ?)`,
      [role, req.user.id]
    );
    res.json({ count: rows[0].count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};