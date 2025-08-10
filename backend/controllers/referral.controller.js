const db = require('../config/db');

exports.getReferralData = async (req, res) => {
  try {
    // Get referral list with user details (sesuai struktur tabel)
    const [refList] = await db.query(`
      SELECT 
        u2.name as full_name, 
        u2.email, 
        r.created_at as registered_date
      FROM referrals r
      JOIN users u1 ON u1.id = r.referrer_id
      JOIN users u2 ON u2.id = r.referred_id 
      WHERE r.referrer_id = ?
      ORDER BY r.created_at DESC
    `, [req.user.id]);

    // Get commission data
    const [commission] = await db.query(`
      SELECT 
        SUM(CASE WHEN converted = 0 THEN amount ELSE 0 END) as current_earnings,
        SUM(CASE WHEN converted = 1 THEN amount ELSE 0 END) as converted_earnings
      FROM commissions 
      WHERE user_id = ?
    `, [req.user.id]);

    // Get referral stats
    const [stats] = await db.query(`
      SELECT 
        COUNT(DISTINCT r.id) as total_registered,
        (SELECT COUNT(*) FROM referral_visits WHERE referrer_id = ?) as total_visited
      FROM referrals r
      WHERE r.referrer_id = ?
    `, [req.user.id, req.user.id]);

    res.json({
      referral_link: `blasterc.id/invite/${req.user.referral_code}`,
      referrals: refList,
      stats: {
        current_earnings: commission[0]?.current_earnings || 0,
        converted_earnings: commission[0]?.converted_earnings || 0,
        total_registered: stats[0]?.total_registered || 0,
        total_visited: stats[0]?.total_visited || 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.convertCommission = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const [rows] = await db.query(`
      SELECT SUM(amount) as total 
      FROM commissions 
      WHERE user_id = ? AND converted = 0
    `, [req.user.id]);
    
    const available = rows[0]?.total || 0;
    
    if (amount > available) {
      return res.status(400).json({ 
        error: 'Amount exceeds available balance',
        available_balance: available,
        requested_amount: amount
      });
    }
    
    if (amount < 10) {
      return res.status(400).json({ error: 'Minimum convert is 10 USDT' });
    }

    // Di controller
if (commission_rate < 0) {
  return res.status(400).json({ 
    error: 'Commission rate cannot be negative',
    field: 'commission_rate'
  });
}

if (min_conversion < 1) {
  return res.status(400).json({
    error: 'Minimum conversion must be at least 1 USDT',
    field: 'min_conversion'
  });
}

    // Mark as converted
    await db.query(`
      UPDATE commissions 
      SET converted = 1, 
          converted_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND converted = 0
      LIMIT ?
    `, [req.user.id, Math.floor(amount / 0.5)]);

    // Update saldo USDT user
    await db.query(`
      UPDATE users 
      SET usdt_balance = COALESCE(usdt_balance, 0) + ?
      WHERE id = ?
    `, [amount, req.user.id]);

    res.json({ 
      success: true,
      message: `Successfully converted ${amount} USDT`,
      new_balance: available - amount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllReferrals = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  
  try {
    const [rows] = await db.query(`
      SELECT 
        r.id, 
        u1.name as referrer_name,
        u1.email as referrer_email,
        u2.name as referred_name,
        u2.email as referred_email,
        r.created_at
      FROM referrals r
      JOIN users u1 ON u1.id = r.referrer_id
      JOIN users u2 ON u2.id = r.referred_id
      ORDER BY r.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getBalance = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        SUM(CASE WHEN converted = 0 THEN amount ELSE 0 END) as available_balance,
        SUM(CASE WHEN converted = 1 THEN amount ELSE 0 END) as converted_balance
       FROM commissions 
       WHERE user_id = ?`, 
      [req.user.id]
    );
    
    res.json({ 
      available: rows[0]?.available_balance || 0,
      converted: rows[0]?.converted_balance || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Admin: Create new referral role
exports.createReferralRole = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  try {
    const { role_name, commission_rate, min_conversion } = req.body;

    // Validasi input
    if (!role_name || !commission_rate || !min_conversion) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Simpan ke database
    const [result] = await db.query(
      `INSERT INTO referral_roles 
       (role_name, commission_rate, min_conversion) 
       VALUES (?, ?, ?)`,
      [role_name, commission_rate, min_conversion]
    );

    res.status(201).json({
      success: true,
      message: 'New referral role created',
      role_id: result.insertId
    });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Role name already exists' });
    }
    res.status(500).json({ error: err.message });
  }
};

// Admin: Get all referral roles
exports.getReferralRoles = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const [roles] = await db.query('SELECT * FROM referral_roles');
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


