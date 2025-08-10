const db = require('../config/db');

// GET for user & admin (shared endpoint)
exports.getNotifications = async (req, res) => {
  const role = req.user.role; // 'user' atau 'admin'
  try {
    const [rows] = await db.query(
      `SELECT * FROM notifications WHERE user_scope = 'all' OR user_scope = ? ORDER BY created_at DESC`,
      [role]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin only: Create new notification
exports.createNotification = async (req, res) => {
  // Validasi input
  const { title, content, user_scope } = req.body;
  
  if (!title || !content || !user_scope) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['title', 'content', 'user_scope']
    });
  }

  // Validasi user_scope
  if (!['all', 'user', 'admin'].includes(user_scope)) {
    return res.status(400).json({
      error: 'Invalid user_scope',
      details: 'Allowed values: all, user, admin'
    });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO notifications 
       (title, content, user_scope, created_by, created_at) 
       VALUES (?, ?, ?, ?, NOW())`,
      [title, content, user_scope, req.user.id]
    );
    
    res.status(201).json({ 
      success: true,
      message: 'Notification created successfully',
      notification: { 
        id: result.insertId,
        title, 
        user_scope,
        created_by: req.user.id,
        created_at: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Database error',
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};