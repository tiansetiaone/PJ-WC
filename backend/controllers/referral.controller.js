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
    
    // Input validation
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Get user's role details
    const [role] = await db.query(
      'SELECT commission_rate, min_conversion FROM referral_roles WHERE role_name = ?',
      [req.user.role]
    );

    const minConversion = role[0]?.min_conversion || 10;
    const commissionRate = role[0]?.commission_rate || 0.5;

    // Get available balance
    const [rows] = await db.query(`
      SELECT SUM(amount) as total 
      FROM commissions 
      WHERE user_id = ? AND converted = 0
    `, [req.user.id]);
    
    const available = rows[0]?.total || 0;
    
    // Validate amount
    if (amount > available) {
      return res.status(400).json({ 
        error: 'Amount exceeds available balance',
        available_balance: available,
        requested_amount: amount
      });
    }
    
    if (amount < minConversion) {
      return res.status(400).json({ 
        error: `Minimum convert is ${minConversion} USDT`,
        min_conversion: minConversion
      });
    }

    // Mark as converted
    await db.query(`
      UPDATE commissions 
      SET converted = 1, 
          converted_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND converted = 0
      LIMIT ?
    `, [req.user.id, Math.floor(amount / commissionRate)]);

    // Update user balance
    await db.query(`
      UPDATE users 
      SET usdt_balance = COALESCE(usdt_balance, 0) + ?
      WHERE id = ?
    `, [amount, req.user.id]);

    res.json({ 
      success: true,
      message: `Successfully converted ${amount} USDT`,
      new_balance: available - amount,
      converted_amount: amount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getAllReferrals = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  
  try {
    // Debugging: Check counts
    const [referralCount] = await db.query('SELECT COUNT(*) as count FROM referrals');
    const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
    
    console.log(`Total referrals: ${referralCount[0].count}, Total users: ${userCount[0].count}`);

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

    // Debugging: Log the raw query results
    console.log('Raw query results:', rows);

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'No referrals found',
        counts: {
          referrals: referralCount[0].count,
          users: userCount[0].count
        }
      });
    }

    res.json(rows);
  } catch (err) {
    console.error('Error in getAllReferrals:', err);
    res.status(500).json({ 
      error: 'Failed to get referrals',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
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
// Admin: Create new referral role
exports.createReferralRole = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  try {
    const { role_name, commission_type, commission_rate, min_conversion, level } = req.body;

    // Validasi input
    if (!role_name || !commission_type || !commission_rate || !min_conversion) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['flat', 'percent'].includes(commission_type)) {
      return res.status(400).json({ error: 'Invalid commission_type (flat|percent)' });
    }

    // Simpan ke database
    const [result] = await db.query(
      `INSERT INTO referral_roles 
       (role_name, commission_type, commission_rate, min_conversion, level) 
       VALUES (?, ?, ?, ?, ?)`,
      [role_name, commission_type, commission_rate, min_conversion, level || 1]
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


// Admin: Get referral role details
exports.getReferralRole = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  try {
    const { id } = req.params;

    const [role] = await db.query(
      'SELECT * FROM referral_roles WHERE id = ?',
      [id]
    );

    if (!role.length) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json(role[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// Track referral visit
exports.trackVisit = async (req, res) => {
  try {
    const { referrer_code } = req.params;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    // Get referrer ID from code
    const [referrer] = await db.query(
      'SELECT id FROM users WHERE referral_code = ?',
      [referrer_code]
    );

    if (!referrer.length) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    // Record visit
    await db.query(
      'INSERT INTO referral_visits (referrer_id, ip_address, user_agent) VALUES (?, ?, ?)',
      [referrer[0].id, ip, userAgent]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCommissionStats = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(DISTINCT user_id) as total_affiliates,
        SUM(CASE WHEN converted = 0 THEN amount ELSE 0 END) as pending_commissions,
        SUM(CASE WHEN converted = 1 THEN amount ELSE 0 END) as converted_commissions,
        SUM(amount) as total_commissions
      FROM commissions
    `);

    const [recentConversions] = await db.query(`
      SELECT 
        c.id,
        u.name as user_name,
        c.amount,
        c.converted_at
      FROM commissions c
      JOIN users u ON u.id = c.user_id
      WHERE c.converted = 1
      ORDER BY c.converted_at DESC
      LIMIT 10
    `);

    res.json({
      stats: stats[0],
      recent_conversions: recentConversions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Admin: Update referral role
exports.updateReferralRole = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  try {
    const { id } = req.params;
    const { role_name, commission_type, commission_rate, min_conversion, level } = req.body;

    if (!role_name || !commission_type || !commission_rate || !min_conversion) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['flat', 'percent'].includes(commission_type)) {
      return res.status(400).json({ error: 'Invalid commission_type' });
    }

    const [existingRole] = await db.query(
      'SELECT * FROM referral_roles WHERE id = ?',
      [id]
    );
    if (!existingRole.length) {
      return res.status(404).json({ error: 'Role not found' });
    }

    await db.query(
      `UPDATE referral_roles 
       SET role_name = ?, commission_type = ?, commission_rate = ?, min_conversion = ?, level = ?, updated_at = NOW()
       WHERE id = ?`,
      [role_name, commission_type, commission_rate, min_conversion, level || 1, id]
    );

    res.json({
      success: true,
      message: 'Referral role updated successfully'
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// Admin: Delete referral role
exports.deleteReferralRole = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  try {
    const { id } = req.params;

    // Check if role exists
    const [existingRole] = await db.query(
      'SELECT * FROM referral_roles WHERE id = ?',
      [id]
    );

    if (!existingRole.length) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Prevent deletion of default role
    if (existingRole[0].is_default) {
      return res.status(400).json({ error: 'Cannot delete default role' });
    }

    // Delete role
    await db.query('DELETE FROM referral_roles WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Referral role deleted successfully'
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Admin: Set default referral role
exports.setDefaultRole = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  try {
    const { id } = req.params;

    // Check if role exists
    const [existingRole] = await db.query(
      'SELECT * FROM referral_roles WHERE id = ?',
      [id]
    );

    if (!existingRole.length) {
      return res.status(404).json({ error: 'Role not found' });
    }

    try {
      // Reset all defaults
      await db.query(
        'UPDATE referral_roles SET is_default = 0 WHERE is_default = 1'
      );
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        // Column doesn't exist, skip this step
        console.warn('is_default column not found, skipping reset');
      } else {
        throw err;
      }
    }

    // Set new default
    await db.query(
      'UPDATE referral_roles SET is_default = 1 WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Default referral role updated successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Add this function to referral.controller.js
async function checkReferralCommissions(userId) {
  try {
    const [chain] = await db.query(`
      WITH RECURSIVE referral_chain AS (
        SELECT referrer_id, referred_id, 1 as level
        FROM referrals
        WHERE referred_id = ?
        
        UNION ALL
        
        SELECT r.referrer_id, r.referred_id, rc.level + 1
        FROM referrals r
        JOIN referral_chain rc ON r.referred_id = rc.referrer_id
      )
      SELECT referrer_id, level FROM referral_chain
      ORDER BY level
    `, [userId]);

    const commissionsAwarded = [];

    for (const link of chain) {
      const referrerId = link.referrer_id;
      const level = link.level;

      // Cek role referrer
      const [role] = await db.query(
        `SELECT commission_type, commission_rate 
         FROM referral_roles 
         WHERE level = ? 
         ORDER BY updated_at DESC LIMIT 1`,
        [level]
      );

      if (!role.length) continue;

      let commissionAmount = 0;
      const depositAmount = 100; // 👉 nanti ambil dari deposit nyata

      if (role[0].commission_type === 'percent') {
        commissionAmount = depositAmount * role[0].commission_rate;
      } else {
        commissionAmount = role[0].commission_rate;
      }

      if (commissionAmount > 0) {
        await db.query(
          'INSERT INTO commissions (user_id, amount, level, status) VALUES (?, ?, ?, "pending")',
          [referrerId, commissionAmount, level]
        );

        commissionsAwarded.push({
          referrer_id: referrerId,
          amount: commissionAmount,
          level,
          type: role[0].commission_type
        });
      }
    }

    return commissionsAwarded;
  } catch (err) {
    console.error('Referral commission error:', err);
    throw err;
  }
}


// Then modify the checkCommissions function to use it:
exports.checkCommissions = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  try {
    const { id } = req.params;
    
    // Verify user exists
    const [user] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (!user.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Trigger commission check
    const results = await checkReferralCommissions(id);
    
    res.json({
      success: true,
      message: 'Commission check completed',
      commissions_awarded: results.length,
      details: results
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to check commissions',
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};

exports.getGlobalReferralStats = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  try {
    const [rows] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM referrals) AS total_registered,
        (SELECT COUNT(*) FROM referral_visits) AS total_visited,
        (SELECT SUM(CASE WHEN converted = 1 THEN amount ELSE 0 END) FROM commissions) AS total_payouts,
        (SELECT SUM(CASE WHEN converted = 0 THEN amount ELSE 0 END) FROM commissions) AS total_pending,
        (SELECT SUM(amount) FROM commissions) AS total_commissions
    `);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// referral.controller.js
exports.getConvertedHistory = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
         id,
         amount,
         converted_at 
       FROM commissions
       WHERE user_id = ? AND converted = 1
       ORDER BY converted_at DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// referral.controller.js

// Admin: Get all referral roles (for settings history)
exports.getAllReferralRoles = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM referral_roles ORDER BY updated_at DESC, created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
