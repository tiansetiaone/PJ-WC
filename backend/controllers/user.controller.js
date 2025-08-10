const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, username, email, whatsapp_number, usdt_address FROM users WHERE id = ?`,
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  const { name, whatsapp_number, usdt_address } = req.body;
  try {
    await db.query(
      `UPDATE users SET name = ?, whatsapp_number = ?, usdt_address = ? WHERE id = ?`,
      [name, whatsapp_number, usdt_address, req.user.id]
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const [rows] = await db.query(`SELECT password FROM users WHERE id = ?`, [req.user.id]);
    const user = rows[0];

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: 'Wrong current password' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query(`UPDATE users SET password = ? WHERE id = ?`, [hashed, req.user.id]);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
