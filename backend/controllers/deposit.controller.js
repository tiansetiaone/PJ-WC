const db = require("../config/db");
const { validateAddress, generateDepositAddress } = require("../utils/blockchain");

// Generate deposit address based on network
exports.generateDepositAddress = async (req, res) => {
  const { network, amount } = req.body;

  try {
    // Validate network
    if (!["TRC20", "ERC20", "BEP20"].includes(network)) {
      return res.status(400).json({ error: "Invalid network" });
    }

    // Validate amount
    if (parseFloat(amount) < 10.0) {
      return res.status(400).json({ error: "Minimum deposit is 10 USDT" });
    }

    // Generate address
    const address = generateDepositAddress(network);
    const memo = `UID${req.user.id}`;

    // Create pending deposit record
    const [result] = await db.query(
      `INSERT INTO deposits 
       (user_id, amount, network, destination_address, memo, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [req.user.id, amount, network, address, memo]
    );

    res.json({
      success: true,
      deposit_id: result.insertId,
      address,
      memo,
      note: "Please send exact amount to this address",
      expires_in: 3600, // 1 hour expiration
    });
  } catch (err) {
    console.error("Generate address error:", err);
    res.status(500).json({
      error: "Failed to generate deposit address",
      details: process.env.NODE_ENV === "development" ? err.message : null,
    });
  }
};

// Process approved deposits and trigger referral commissions
async function processApprovedDeposit(depositId, userId, amount) {
  try {
    // Update user balance - change 'usdt_balance' to your actual column name
    await db.query(
      `UPDATE users SET balance = COALESCE(balance, 0) + ? 
       WHERE id = ?`,
      [amount, userId]
    );

    // Check if this deposit qualifies user for referral commissions
    const [user] = await db.query(`SELECT referred_by FROM users WHERE id = ?`, [userId]);

    if (user[0]?.referred_by) {
      await checkReferralCommissions(userId);
    }
  } catch (err) {
    console.error("Deposit processing error:", err);
    throw err;
  }
}

// Check and award referral commissions
async function checkReferralCommissions(userId) {
  try {
    // Get the entire referral chain
    const [chain] = await db.query(
      `
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
    `,
      [userId]
    );

    // Process each level in the chain
    for (const link of chain) {
      const referrerId = link.referrer_id;
      const level = link.level;

      // Check if both users have minimum deposit
      const referrerHasDeposit = await hasMinimumDeposit(referrerId);
      const referredHasDeposit = await hasMinimumDeposit(userId);

      if (referrerHasDeposit && referredHasDeposit) {
        // Calculate commission based on level (higher levels get less)
        const commissionAmount = (0.5 / level).toFixed(2);

        // Add commission
        await db.query('INSERT INTO commissions (user_id, amount, level, status) VALUES (?, ?, ?, "pending")', [referrerId, commissionAmount, level]);

        console.log(`Added $${commissionAmount} commission to user ${referrerId} (level ${level})`);
      }
    }
  } catch (err) {
    console.error("Referral commission error:", err);
    throw err;
  }
}

// Submit deposit evidence (tx_hash)
// Enhanced submit evidence with Etherscan link generation
// Modify the submitDepositEvidence function to ensure status changes to 'checking'
exports.submitDepositEvidence = async (req, res) => {
  try {
    const { deposit_id, tx_hash } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!deposit_id || !tx_hash) {
      return res.status(400).json({
        error: "Deposit ID and TX Hash are required",
      });
    }

    // Verify deposit belongs to user and is pending
    const [deposit] = await db.query(
      `SELECT * FROM deposits 
       WHERE id = ? AND user_id = ? AND status = 'pending'`,
      [deposit_id, userId]
    );

    if (!deposit.length) {
      return res.status(404).json({
        error: "Deposit not found or already submitted",
        code: "DEPOSIT_NOT_FOUND",
      });
    }

    // Update deposit with tx_hash and change status to checking
    await db.query(
      `UPDATE deposits 
       SET tx_hash = ?, 
           status = 'checking',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [tx_hash, deposit_id]
    );

    res.json({
      success: true,
      message: "Deposit submitted for verification",
      status: "checking",
    });
  } catch (err) {
    console.error("Submit evidence error:", err);
    res.status(500).json({
      error: "Failed to submit deposit evidence",
    });
  }
};

// Enhanced deposit status check
exports.checkDepositStatus = async (req, res) => {
  const { deposit_id } = req.params;
  const userId = req.user.id;

  try {
    const [deposit] = await db.query(
      `SELECT 
        id, amount, network, status, 
        tx_hash, created_at, updated_at,
        CASE 
          WHEN network = 'TRC20' THEN CONCAT('https://tronscan.org/#/transaction/', tx_hash)
          WHEN network = 'ERC20' THEN CONCAT('https://etherscan.io/tx/', tx_hash)
          WHEN network = 'BEP20' THEN CONCAT('https://bscscan.com/tx/', tx_hash)
          ELSE NULL
        END as tx_link
       FROM deposits 
       WHERE id = ? AND user_id = ?`,
      [deposit_id, userId]
    );

    if (!deposit.length) {
      return res.status(404).json({
        error: "Deposit not found",
        code: "DEPOSIT_NOT_FOUND",
      });
    }

    res.json({
      success: true,
      data: deposit[0],
      status_description: getStatusDisplay(deposit[0].status),
    });
  } catch (err) {
    console.error("Check deposit status error:", err);
    res.status(500).json({
      error: "Failed to check deposit status",
      details: process.env.NODE_ENV === "development" ? err.message : null,
    });
  }
};

// Get deposit history with filters
exports.getUserDeposits = async (req, res) => {
  const { status, network, limit = 10, page = 1 } = req.query;
  const userId = req.user.id;

  try {
    let query = `SELECT 
                  id,
                  CONCAT(LEFT(id, 4), '**********', RIGHT(id, 4)) as masked_id,
                  amount,
                  status,
                  DATE_FORMAT(created_at, '%d %M %Y %H:%i') as top_up_date,
                  network
                FROM deposits WHERE user_id = ?`;
    const params = [userId];
    const offset = (page - 1) * limit;

    // Optional filters
    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }
    if (network) {
      query += ` AND network = ?`;
      params.push(network);
    }

    // Pagination
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [rows] = await db.query(query, params);

    // Get total count
    const [total] = await db.query(`SELECT COUNT(*) as count FROM deposits WHERE user_id = ?`, [userId]);

    res.json({
      success: true,
      data: rows.map((row) => ({
        ...row,
        amount: `$${Number(row.amount).toFixed(3)}`, // Convert to number first
        status: getStatusDisplay(row.status),
      })),
      meta: {
        total: total[0].count,
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_pages: Math.ceil(total[0].count / limit),
      },
    });
  } catch (err) {
    console.error("Get deposits error:", err);
    res.status(500).json({
      error: "Failed to get deposit history",
      details:
        process.env.NODE_ENV === "development"
          ? {
              message: err.message,
              sql: err.sql,
              stack: err.stack,
            }
          : null,
    });
  }
};

// Helper function to convert status to display text
function getStatusDisplay(status) {
  const statusMap = {
    pending: "Pending Transaction",
    checking: "Checking Deposit",
    approved: "Deposit Success",
    rejected: "Deposit Failed",
  };
  return statusMap[status] || status;
}

// Admin: Get all deposit requests
exports.getDepositRequests = async (req, res) => {
  const { status, search, limit = 10, page = 1 } = req.query;

  try {
    let query = `SELECT 
            d.id,
            u.username as user_request,
            d.amount as top_up,
            d.tx_hash as evidence,
            d.status,
            DATE_FORMAT(d.created_at, '%d %M %Y %H:%i') as top_up_date
            FROM deposits d
            JOIN users u ON d.user_id = u.id`;

    let countQuery = `SELECT COUNT(*) as count FROM deposits d`;
    const params = [];
    const countParams = [];

    // Optional filters
    if (status) {
      query += ` WHERE d.status = ?`;
      countQuery += ` WHERE d.status = ?`;
      params.push(status);
      countParams.push(status);
    }

    if (search) {
      const searchCondition = ` WHERE u.username LIKE ?`;
      query += status ? ` AND u.username LIKE ?` : searchCondition;
      countQuery += status ? ` AND u.username LIKE ?` : searchCondition;
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query += ` ORDER BY d.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [rows] = await db.query(query, params);
    const [total] = await db.query(countQuery, countParams);

    res.json({
      success: true,
      data: rows.map((row) => ({
        ...row,
        top_up: `$${Number(row.top_up).toFixed(2)}`,
        status: getStatusDisplay(row.status),
      })),
      meta: {
        total: total[0].count,
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_pages: Math.ceil(total[0].count / limit),
      },
    });
  } catch (err) {
    console.error("Get deposit requests error:", err);
    res.status(500).json({
      error: "Failed to get deposit requests",
      details: process.env.NODE_ENV === "development" ? err.message : null,
    });
  }
};

// Admin: Approve/Reject deposit
exports.processDeposit = async (req, res) => {
  const { deposit_id, action, admin_notes } = req.body;

  try {
    // Validate input
    if (!deposit_id || !["approve", "reject"].includes(action)) {
      return res.status(400).json({
        error: "Invalid deposit ID or action",
        allowed_actions: ["approve", "reject"],
      });
    }

    // Check if deposit exists and is in checking status
    const [deposit] = await db.query(`SELECT * FROM deposits WHERE id = ? AND status = 'checking'`, [deposit_id]);

    if (!deposit.length) {
      return res.status(404).json({
        error: "Deposit not found or already processed",
        code: "DEPOSIT_ALREADY_PROCESSED",
      });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    // Update deposit status
    await db.query(
      `UPDATE deposits 
       SET status = ?, 
           admin_notes = ?,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [newStatus, admin_notes || null, deposit_id]
    );

    // If approved, process the deposit and check referrals
    if (action === "approve") {
      const userId = deposit[0].user_id;
      const amount = deposit[0].amount;

      await processApprovedDeposit(deposit_id, userId, amount);
    }

    res.json({
      success: true,
      message: `Deposit ${newStatus} successfully`,
      deposit_id,
      new_status: newStatus,
      user_id: deposit[0].user_id,
      amount: deposit[0].amount,
    });
  } catch (err) {
    console.error("Process deposit error:", err);
    res.status(500).json({
      error: "Failed to process deposit",
      details: process.env.NODE_ENV === "development" ? err.message : null,
    });
  }
};

// Enhanced deposit controller methods
exports.initiateDeposit = async (req, res) => {
  const { network, amount, is_custom = false } = req.body;

  try {
    // Validate network
    if (!["TRC20", "ERC20", "BEP20"].includes(network)) {
      return res.status(400).json({
        error: "Invalid network",
        allowed: ["TRC20", "ERC20", "BEP20"],
      });
    }

    // Validate amount
    const minAmount = is_custom ? 10.0 : 10.0; // Custom minimum for custom amounts
    if (parseFloat(amount) < minAmount) {
      return res.status(400).json({
        error: `Minimum deposit is ${minAmount} USDT`,
        minimum: minAmount,
      });
    }

    // Generate deposit address and memo
    const address = generateDepositAddress(network);
    const memo = `UID${req.user.id}`;

    // Create deposit record
    const [result] = await db.query(
      `INSERT INTO deposits 
       (user_id, amount, network, destination_address, memo, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [req.user.id, amount, network, address, memo]
    );

    res.json({
      success: true,
      deposit_id: result.insertId,
      address,
      memo,
      amount,
      network,
      note: "Please send exact amount to this address",
      expires_in: 3600, // 1 hour expiration
    });
  } catch (err) {
    console.error("Deposit initiation error:", err);
    res.status(500).json({
      error: "Failed to initiate deposit",
      details: process.env.NODE_ENV === "development" ? err.message : null,
    });
  }
};

exports.getDepositDetails = async (req, res) => {
  const { deposit_id } = req.params;

  try {
    const [deposit] = await db.query(
      `SELECT 
        d.*,
        u.username,
        u.email,
        CASE 
          WHEN d.network = 'TRC20' THEN CONCAT('https://tronscan.org/#/transaction/', d.tx_hash)
          WHEN d.network = 'ERC20' THEN CONCAT('https://etherscan.io/tx/', d.tx_hash)
          WHEN d.network = 'BEP20' THEN CONCAT('https://bscscan.com/tx/', d.tx_hash)
          ELSE NULL
        END as tx_link
       FROM deposits d
       JOIN users u ON d.user_id = u.id
       WHERE d.id = ?`,
      [deposit_id]
    );

    if (!deposit.length) {
      return res.status(404).json({
        error: "Deposit not found",
        code: "DEPOSIT_NOT_FOUND",
      });
    }

    res.json({
      success: true,
      data: deposit[0],
      status_description: getStatusDisplay(deposit[0].status),
    });
  } catch (err) {
    console.error("Get deposit details error:", err);
    res.status(500).json({
      error: "Failed to get deposit details",
      details: process.env.NODE_ENV === "development" ? err.message : null,
    });
  }
};

exports.generateDepositReport = async (req, res) => {
  const { start_date, end_date, status, network } = req.query;

  try {
    let query = `SELECT 
                  d.id,
                  u.username,
                  d.amount,
                  d.network,
                  d.status,
                  d.tx_hash,
                  d.admin_notes,
                  DATE_FORMAT(d.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
                  DATE_FORMAT(d.updated_at, '%Y-%m-%d %H:%i:%s') as updated_at
                FROM deposits d
                JOIN users u ON d.user_id = u.id
                WHERE d.created_at BETWEEN ? AND ?`;

    const params = [start_date || "1970-01-01", end_date || new Date().toISOString().split("T")[0] + " 23:59:59"];

    if (status) {
      query += ` AND d.status = ?`;
      params.push(status);
    }
    if (network) {
      query += ` AND d.network = ?`;
      params.push(network);
    }

    query += ` ORDER BY d.created_at DESC`;

    const [deposits] = await db.query(query, params);

    // In a real implementation, you would generate a PDF/Excel file here
    // For this example, we'll return JSON with all the report data
    const report = {
      generated_at: new Date().toISOString(),
      filters: {
        start_date,
        end_date,
        status,
        network,
      },
      total_deposits: deposits.length,
      total_amount: deposits.reduce((sum, deposit) => sum + parseFloat(deposit.amount), 0),
      success_count: deposits.filter((d) => d.status === "approved").length,
      failed_count: deposits.filter((d) => d.status === "rejected").length,
      pending_count: deposits.filter((d) => d.status === "pending").length,
      deposits,
    };

    res.json({
      success: true,
      data: report,
      message: "Deposit report generated successfully",
    });
  } catch (err) {
    console.error("Generate deposit report error:", err);
    res.status(500).json({
      error: "Failed to generate deposit report",
      details: process.env.NODE_ENV === "development" ? err.message : null,
    });
  }
};

// Helper function to check if user has minimum deposit
async function hasMinimumDeposit(userId) {
  const [result] = await db.query(
    `SELECT SUM(amount) as total_deposit 
     FROM deposits 
     WHERE user_id = ? AND status = 'approved'`,
    [userId]
  );
  return result[0]?.total_deposit >= 10; // At least 10 USDT deposited
}

// Modified convertCommission function with deposit check
exports.convertCommission = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Get available balance with deposit check
    const [rows] = await db.query(
      `
      SELECT SUM(c.amount) as total 
      FROM commissions c
      WHERE c.user_id = ? 
        AND c.converted = 0
        AND EXISTS (
          SELECT 1 FROM deposits d
          WHERE d.user_id = c.user_id
            AND d.status = 'approved'
          GROUP BY d.user_id
          HAVING SUM(d.amount) >= 10
        )
    `,
      [req.user.id]
    );

    const available = rows[0]?.total || 0;

    if (amount > available) {
      return res.status(400).json({
        error: "Amount exceeds available balance",
        available_balance: available,
        requested_amount: amount,
      });
    }

    // Mark as converted
    await db.query(
      `
      UPDATE commissions 
      SET converted = 1, 
          converted_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND converted = 0
      ORDER BY created_at ASC
      LIMIT ?
    `,
      [req.user.id, Math.ceil(amount / 0.5)]
    );

    // Update user balance
    await db.query(
      `
      UPDATE users 
      SET usdt_balance = COALESCE(usdt_balance, 0) + ?
      WHERE id = ?
    `,
      [amount, req.user.id]
    );

    res.json({
      success: true,
      message: `Successfully converted ${amount} USDT`,
      new_balance: available - amount,
      converted_amount: amount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// Ambil total credit user (semua deposit sukses)
exports.getTotalCredit = async (req, res) => {
  try {
    const userId = req.user.id; // dari JWT

    const [rows] = await db.query(
      "SELECT SUM(amount) AS total FROM deposits WHERE user_id = ? AND status = 'approved'",
      [userId]
    );

    res.json({
      success: true,
      totalCredit: rows[0].total || 0,
    });
  } catch (err) {
    console.error("Error getTotalCredit:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// Admin: Get Campaign Stats (Success vs Failed)
// Admin: Get Deposit Stats (Received vs Failed)
exports.getDepositStats = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS received,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS failed
      FROM deposits
    `);

    res.json({
      success: true,
      data: {
        received: rows[0].received || 0,
        failed: rows[0].failed || 0,
      },
    });
  } catch (err) {
    console.error("Get deposit stats error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to get deposit stats",
      details: process.env.NODE_ENV === "development" ? err.message : null,
    });
  }
};

