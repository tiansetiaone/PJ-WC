const db = require('../config/db');

// Sudah ada
exports.getAllUsers = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const [rows] = await db.query(`SELECT id, name, email, username FROM users`);
  res.json(rows);
};

// Enhanced Deposit Management
exports.getAllDeposits = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        d.id,
        u.name AS user_name,
        u.email,
        d.amount,
        d.network,
        d.status,
        d.tx_hash,
        DATE_FORMAT(d.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
        DATE_FORMAT(d.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
      FROM deposits d
      JOIN users u ON d.user_id = u.id
    `;

    const whereClauses = [];
    const params = [];

    if (status) {
      whereClauses.push("d.status = ?");
      params.push(status);
    }

    if (search) {
      whereClauses.push("(u.name LIKE ? OR u.email LIKE ? OR d.tx_hash LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (whereClauses.length > 0) {
      query += " WHERE " + whereClauses.join(" AND ");
    }

    query += " ORDER BY d.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), offset);

    const [deposits] = await db.query(query, params);

    // Get total count
    const [total] = await db.query(
      `SELECT COUNT(*) as count FROM deposits ${whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(" AND ") : ''}`,
      params.slice(0, -2) // Remove limit and offset for count
    );

    res.json({
      success: true,
      data: deposits,
      pagination: {
        total: total[0].count,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(total[0].count / limit)
      }
    });

  } catch (err) {
    console.error("Get all deposits error:", err);
    res.status(500).json({ 
      error: "Failed to fetch deposits",
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};

// Campaign Management Functions
exports.getAllCampaigns = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        c.*,
        u.name AS creator_name,
        u.email AS creator_email,
        COUNT(cn.id) AS recipient_count,
        SUM(CASE WHEN cn.status = 'sent' THEN 1 ELSE 0 END) AS sent_count
      FROM campaigns c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN campaign_numbers cn ON c.id = cn.campaign_id
    `;

    const whereClauses = [];
    const params = [];

    if (status) {
      whereClauses.push("c.status = ?");
      params.push(status);
    }

    if (type) {
      whereClauses.push("c.campaign_type = ?");
      params.push(type);
    }

    if (whereClauses.length > 0) {
      query += " WHERE " + whereClauses.join(" AND ");
    }

    query += `
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), offset);

    const [campaigns] = await db.query(query, params);

    // Get total count
    const [total] = await db.query(
      `SELECT COUNT(*) as count FROM campaigns ${whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(" AND ") : ''}`,
      params.slice(0, -2) // Remove limit and offset for count
    );

    res.json({
      success: true,
      data: campaigns.map(campaign => ({
        ...campaign,
        progress: campaign.recipient_count > 0 
          ? Math.round((campaign.sent_count / campaign.recipient_count) * 100)
          : 0
      })),
      pagination: {
        total: total[0].count,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(total[0].count / limit)
      }
    });

  } catch (err) {
    console.error("Get all campaigns error:", err);
    res.status(500).json({ 
      error: "Failed to fetch campaigns",
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};

// ✅ NEW: Approve deposit
exports.approveDeposit = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { id } = req.params;
  await db.query(`UPDATE deposits SET status = 'approved' WHERE id = ?`, [id]);
  res.json({ message: 'Deposit approved' });
};

// ✅ NEW: Reject deposit
exports.rejectDeposit = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { id } = req.params;
  await db.query(`UPDATE deposits SET status = 'rejected' WHERE id = ?`, [id]);
  res.json({ message: 'Deposit rejected' });
};

// ✅ NEW: Ambil semua referral
exports.getAllReferrals = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const [rows] = await db.query(`
    SELECT r.id, u1.username AS referrer, u2.username AS referred, r.created_at
    FROM referrals r
    JOIN users u1 ON u1.id = r.referrer_id
    JOIN users u2 ON u2.id = r.referred_id
    ORDER BY r.created_at DESC
  `);
  res.json(rows);
};

// ✅ NEW: Ambil semua support ticket
exports.getAllSupportTickets = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const [rows] = await db.query(`SELECT * FROM support_tickets ORDER BY created_at DESC`);
  res.json(rows);
};

// ✅ NEW: Balas support ticket
exports.respondSupportTicket = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { id } = req.params;
  const { response } = req.body;
  await db.query(`UPDATE support_tickets SET response = ? WHERE id = ?`, [response, id]);
  res.json({ message: 'Ticket responded successfully' });
};

// ✅ NEW: Update profil user (oleh admin)
exports.updateUserProfile = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { id } = req.params;
  const { name, whatsapp_number, usdt_address } = req.body;

  await db.query(
    `UPDATE users SET name = ?, whatsapp_number = ?, usdt_address = ? WHERE id = ?`,
    [name, whatsapp_number, usdt_address, id]
  );
  res.json({ message: 'User profile updated by admin' });
};


exports.getCampaignDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const [campaign] = await db.query(`
      SELECT 
        c.*,
        u.name AS creator_name,
        u.email AS creator_email
      FROM campaigns c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [id]);

    if (!campaign.length) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const [recipients] = await db.query(`
      SELECT 
        id,
        phone_number,
        status,
        error_message,
        DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS processed_at
      FROM campaign_numbers
      WHERE campaign_id = ?
      ORDER BY created_at DESC
      LIMIT 1000
    `, [id]);

    const [stats] = await db.query(`
      SELECT 
        status,
        COUNT(*) AS count
      FROM campaign_numbers
      WHERE campaign_id = ?
      GROUP BY status
    `, [id]);

    res.json({
      success: true,
      data: {
        ...campaign[0],
        recipients,
        stats
      }
    });

  } catch (err) {
    console.error("Get campaign details error:", err);
    res.status(500).json({ 
      error: "Failed to fetch campaign details",
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};


exports.updateCampaignStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected', 'processing', 'completed'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    await db.query(
      `UPDATE campaigns SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, id]
    );

    res.json({
      success: true,
      message: `Campaign status updated to ${status}`
    });

  } catch (err) {
    console.error("Update campaign status error:", err);
    res.status(500).json({ 
      error: "Failed to update campaign status",
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};

exports.approveDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    // Start transaction
    await db.query('START TRANSACTION');

    // 1. Get deposit info
    const [deposit] = await db.query(
      `SELECT * FROM deposits WHERE id = ? AND status = 'pending' FOR UPDATE`,
      [id]
    );

    if (!deposit.length) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: "Deposit not found or already processed" });
    }

    // 2. Update deposit status
    await db.query(
      `UPDATE deposits 
       SET status = 'approved', admin_notes = ?, updated_at = NOW()
       WHERE id = ?`,
      [adminNotes || null, id]
    );

    // 3. Update user balance
    await db.query(
      `UPDATE users SET balance = balance + ? WHERE id = ?`,
      [deposit[0].amount, deposit[0].user_id]
    );

    // 4. Create transaction record
    await db.query(
      `INSERT INTO transactions 
       (user_id, amount, type, reference_id, status)
       VALUES (?, ?, 'deposit', ?, 'completed')`,
      [deposit[0].user_id, deposit[0].amount, id]
    );

    await db.query('COMMIT');

    res.json({
      success: true,
      message: "Deposit approved and balance updated",
      amount: deposit[0].amount,
      user_id: deposit[0].user_id
    });

  } catch (err) {
    await db.query('ROLLBACK');
    console.error("Approve deposit error:", err);
    res.status(500).json({ 
      error: "Failed to approve deposit",
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};

exports.rejectDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const [deposit] = await db.query(
      `SELECT * FROM deposits WHERE id = ? AND status = 'pending'`,
      [id]
    );

    if (!deposit.length) {
      return res.status(404).json({ error: "Deposit not found or already processed" });
    }

    await db.query(
      `UPDATE deposits 
       SET status = 'rejected', admin_notes = ?, updated_at = NOW()
       WHERE id = ?`,
      [adminNotes || null, id]
    );

    res.json({
      success: true,
      message: "Deposit rejected"
    });

  } catch (err) {
    console.error("Reject deposit error:", err);
    res.status(500).json({ 
      error: "Failed to reject deposit",
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};


// Add to admin.controller.js
exports.adminCreateCampaign = async (req, res) => {
  try {
    const { campaign_name, campaign_date, message, campaign_type, image_url, status } = req.body;
    
    // Validate required fields
    if (!campaign_name || !campaign_date || !message || !campaign_type) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["campaign_name", "campaign_date", "message", "campaign_type"]
      });
    }

    // Validate status if provided
    if (status && !['pending', 'approved', 'processing'].includes(status)) {
      return res.status(400).json({
        error: "Invalid initial status",
        allowed: ["pending", "approved", "processing"]
      });
    }

    // Insert campaign with admin privileges
    const [result] = await db.query(
      `INSERT INTO campaigns
       (user_id, campaign_name, campaign_date, message, image_url, campaign_type, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [req.user.id, campaign_name, campaign_date, message, image_url || null, campaign_type, status || 'pending']
    );

    res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      campaign_id: result.insertId
    });

  } catch (err) {
    console.error("Admin create campaign error:", err);
    res.status(500).json({
      error: "Failed to create campaign",
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};