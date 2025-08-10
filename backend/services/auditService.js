const db = require('../config/db');

exports.logActivity = async ({ userId, action, targetId, metadata }) => {
  try {
    await db.query(
      `INSERT INTO user_activities 
       (user_id, action, target_user_id, metadata) 
       VALUES (?, ?, ?, ?)`,
      [userId, action, targetId, JSON.stringify(metadata)]
    );
  } catch (err) {
    console.error('[AUDIT LOG ERROR]', err);
  }
};