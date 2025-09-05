const db = require("../config/db");
const { validateAddress, generateDepositAddress } = require("../utils/blockchain");
const multer = require("multer");
const path = require("path");

// === Konfigurasi Multer ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/proofs/"); // simpan di folder /uploads/proofs
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); 
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Hanya JPG, PNG, atau PDF yang diizinkan"));
    }
    cb(null, true);
  },
});


// Generate deposit address based on network
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

    // Calculate credit (1 USDT = 100 credit)
    const credit = parseFloat(amount) * 100;

    // Generate address
    const address = generateDepositAddress(network);
    const memo = `UID${req.user.id}`;

    // Create pending deposit record - TAMBAHKAN credit
    const [result] = await db.query(
      `INSERT INTO deposits 
       (user_id, amount, network, destination_address, memo, status, credit)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      [req.user.id, amount, network, address, memo, credit]
    );

    res.json({
      success: true,
      deposit_id: result.insertId,
      address,
      memo,
      note: "Please send exact amount to this address",
      expires_in: 3600, // 1 hour expiration
      credit: credit // Kirim juga ke frontend
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

// === Controller untuk submit evidence ===
exports.submitDepositEvidence = async (req, res) => {
  try {
    const { deposit_id, tx_hash } = req.body;
    const proofFile = req.file ? req.file.path : null;

    if (!deposit_id || !tx_hash || !proofFile) {
      return res.status(400).json({ message: "Deposit ID, Tx hash, dan file bukti wajib diisi" });
    }

    // Update deposit yang sudah ada
    const [result] = await db.query(
      `UPDATE deposits 
       SET tx_hash = ?, proof_file = ?, status = 'checking', updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [tx_hash, proofFile, deposit_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Deposit tidak ditemukan" });
    }

    res.status(200).json({ 
      message: "Deposit evidence submitted, waiting for checking", 
      depositId: deposit_id 
    });
  } catch (err) {
    console.error("Submit evidence error:", err);
    res.status(500).json({ message: "Error submitting deposit evidence" });
  }
};

// Export middleware upload untuk dipakai di routes
exports.uploadProof = upload.single("file");



// Enhanced deposit status check
exports.checkDepositStatus = async (req, res) => {
  const { deposit_id } = req.params;
  const userId = req.user.id;

  try {
    const [deposit] = await db.query(
      `SELECT 
        d.id, 
        d.amount,
        d.credit, 
        d.network, 
        d.status, 
        d.tx_hash, 
        d.created_at, 
        d.updated_at,
        d.destination_address,
        d.memo,
        d.transfer_evidence,
        d.credit,
        d.proof_file,
        d.admin_notes,
        u.usdt_network as user_usdt_network,
        u.usdt_address as user_usdt_address,
        u.name as user_name,
        u.email as user_email,
        CASE 
          WHEN d.network = 'TRC20' THEN CONCAT('https://tronscan.org/#/transaction/', d.tx_hash)
          WHEN d.network = 'ERC20' THEN CONCAT('https://etherscan.io/tx/', d.tx_hash)
          WHEN d.network = 'BEP20' THEN CONCAT('https://bscscan.com/tx/', d.tx_hash)
          ELSE NULL
        END as tx_link,
        CASE 
          WHEN d.network = 'TRC20' THEN CONCAT('https://tronscan.org/#/address/', d.destination_address)
          WHEN d.network = 'ERC20' THEN CONCAT('https://etherscan.io/address/', d.destination_address)
          WHEN d.network = 'BEP20' THEN CONCAT('https://bscscan.com/address/', d.destination_address)
          ELSE NULL
        END as address_link
       FROM deposits d
       LEFT JOIN users u ON d.user_id = u.id
       WHERE d.id = ? AND d.user_id = ?`,
      [deposit_id, userId]
    );

    if (!deposit.length) {
      return res.status(404).json({
        error: "Deposit not found",
        code: "DEPOSIT_NOT_FOUND",
      });
    }

    const depositData = deposit[0];
    
    // Format response data
    const responseData = {
      deposit: {
        id: depositData.id,
        amount: depositData.amount,
        network: depositData.network,
        status: depositData.status,
        tx_hash: depositData.tx_hash,
        destination_address: depositData.destination_address,
        memo: depositData.memo,
        transfer_evidence: depositData.transfer_evidence,
        credit: depositData.credit,
        proof_file: depositData.proof_file,
        admin_notes: depositData.admin_notes,
        created_at: depositData.created_at,
        updated_at: depositData.updated_at,
        tx_link: depositData.tx_link,
        address_link: depositData.address_link
      },
      user: {
        usdt_network: depositData.user_usdt_network,
        usdt_address: depositData.user_usdt_address,
        name: depositData.user_name,
        email: depositData.user_email
      },
      status_description: getStatusDisplay(depositData.status)
    };

    res.json({
      success: true,
      data: responseData
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
    approved: "success",
    rejected: "failed",
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

    // Calculate credit (1 USDT = 100 credit)
    const credit = parseFloat(amount) * 100;

    // Generate deposit address and memo
    const address = generateDepositAddress(network);
    const memo = `UID${req.user.id}`;

    // Create deposit record - TAMBAHKAN credit
    const [result] = await db.query(
      `INSERT INTO deposits 
       (user_id, amount, network, destination_address, memo, status, credit)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      [req.user.id, amount, network, address, memo, credit]
    );

    res.json({
      success: true,
      deposit_id: result.insertId,
      address,
      memo,
      amount,
      network,
      credit: credit, // Kirim juga ke frontend
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

    const [rows] = await db.query("SELECT SUM(amount) AS total FROM deposits WHERE user_id = ? AND status = 'approved'", [userId]);

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

exports.checkDepositStatus = async (req, res) => {
  const { deposit_id } = req.params;
  const userId = req.user.id;

  try {
    const [deposit] = await db.query(
      `SELECT 
        d.id, 
        d.amount,
        d.credit,
        d.network, 
        d.status, 
        d.tx_hash, 
        d.created_at, 
        d.updated_at,
        d.destination_address as recipient_wallet,
        d.memo as your_wallet,
        d.proof_file,
        d.credit,
        d.transfer_evidence,
        d.admin_notes,
        u.usdt_network as user_usdt_network,
        u.usdt_address as user_usdt_address,
        u.name as user_name,
        u.email as user_email,
        u.whatsapp_number as user_whatsapp,
        CASE 
          WHEN d.network = 'TRC20' THEN CONCAT('https://tronscan.org/#/transaction/', d.tx_hash)
          WHEN d.network = 'ERC20' THEN CONCAT('https://etherscan.io/tx/', d.tx_hash)
          WHEN d.network = 'BEP20' THEN CONCAT('https://bscscan.com/tx/', d.tx_hash)
          ELSE NULL
        END as tx_link,
        CASE 
          WHEN d.network = 'TRC20' THEN CONCAT('https://tronscan.org/#/address/', d.destination_address)
          WHEN d.network = 'ERC20' THEN CONCAT('https://etherscan.io/address/', d.destination_address)
          WHEN d.network = 'BEP20' THEN CONCAT('https://bscscan.com/address/', d.destination_address)
          ELSE NULL
        END as address_link,
        CASE 
          WHEN d.network = 'TRC20' THEN CONCAT('https://tronscan.org/#/address/', u.usdt_address)
          WHEN d.network = 'ERC20' THEN CONCAT('https://etherscan.io/address/', u.usdt_address)
          WHEN d.network = 'BEP20' THEN CONCAT('https://bscscan.com/address/', u.usdt_address)
          ELSE NULL
        END as user_address_link
       FROM deposits d
       LEFT JOIN users u ON d.user_id = u.id
       WHERE d.id = ? AND d.user_id = ?`,
      [deposit_id, userId]
    );

    if (!deposit.length) {
      return res.status(404).json({
        success: false,
        error: "Deposit not found",
        code: "DEPOSIT_NOT_FOUND",
      });
    }

    const depositData = deposit[0];
    
    // Format response data dengan struktur yang kompatibel untuk frontend
    const responseData = {
      deposit: {
        id: depositData.id,
        amount: depositData.amount,
        network: depositData.network,
        status: depositData.status,
        tx_hash: depositData.tx_hash,
        recipient_wallet: depositData.recipient_wallet,
        your_wallet: depositData.your_wallet,
        proof_file: depositData.proof_file,
        credit: depositData.credit,
        transfer_evidence: depositData.transfer_evidence,
        admin_notes: depositData.admin_notes,
        created_at: depositData.created_at,
        updated_at: depositData.updated_at,
        tx_link: depositData.tx_link,
        address_link: depositData.address_link,
        // Tambahkan field user di dalam deposit untuk kompatibilitas frontend
        user: {
          usdt_address: depositData.recipient_wallet // Menggunakan recipient_wallet untuk usdt_address
        }
      },
      user: {
        usdt_network: depositData.user_usdt_network,
        usdt_address: depositData.user_usdt_address,
        user_address_link: depositData.user_address_link,
        name: depositData.user_name,
        email: depositData.user_email,
        whatsapp_number: depositData.user_whatsapp
      },
      status_description: getStatusDescription(depositData.status)
    };

    res.json({
      success: true,
      data: responseData
    });
  } catch (err) {
    console.error("Check deposit status error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to check deposit status",
      details: process.env.NODE_ENV === "development" ? err.message : null,
    });
  }
};

// Helper function untuk status description
function getStatusDescription(status) {
  const statusMap = {
    'pending': 'Menunggu konfirmasi',
    'processing': 'Sedang diproses',
    'completed': 'Berhasil',
    'rejected': 'Ditolak',
    'failed': 'Gagal',
    'waiting_payment': 'Menunggu pembayaran'
  };
  
  return statusMap[status] || 'Unknown status';
}


// Get all deposit amounts (active only)
exports.getDepositAmounts = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, value, credits, best FROM deposit_amounts WHERE status = 'active' ORDER BY value ASC"
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    console.error("Get deposit amounts error:", err);
    res.status(500).json({ error: "Failed to get deposit amounts" });
  }
};


// Create new deposit amount
exports.createDepositAmount = async (req, res) => {
  try {
    const { value, credits, best } = req.body;
    await db.query(
      "INSERT INTO deposit_amounts (value, credits, best) VALUES (?, ?, ?)",
      [value, credits, best ? 1 : 0]
    );
    res.json({ success: true, message: "Deposit amount created" });
  } catch (err) {
    console.error("Error creating deposit amount:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update deposit amount
exports.updateDepositAmount = async (req, res) => {
  try {
    const { id } = req.params;
    const { value, credits, best } = req.body;
    await db.query(
      "UPDATE deposit_amounts SET value=?, credits=?, best=? WHERE id=?",
      [value, credits, best ? 1 : 0, id]
    );
    res.json({ success: true, message: "Deposit amount updated" });
  } catch (err) {
    console.error("Error updating deposit amount:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete deposit amount
exports.deleteDepositAmount = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM deposit_amounts WHERE id=?", [id]);
    res.json({ success: true, message: "Deposit amount deleted" });
  } catch (err) {
    console.error("Error deleting deposit amount:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// Ambil riwayat commission yang sudah di-convert (Admin view)
exports.getConvertedHistory = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.id, 
        u.username as user, 
        CONCAT('$', FORMAT(c.amount, 2)) as amount,
        DATE_FORMAT(c.converted_at, '%d %M %Y %H:%i') as date
      FROM commissions c
      JOIN users u ON c.user_id = u.id
      WHERE c.converted = 1
      ORDER BY c.converted_at DESC
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Get converted commissions error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



// Get user USDT info
exports.getUserUSDTInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    const [user] = await db.query(
      `SELECT 
        usdt_network, 
        usdt_address,
        name,
        email
      FROM users 
      WHERE id = ?`,
      [userId]
    );

    if (!user.length) {
      return res.status(404).json({
        error: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    res.json({
      success: true,
      data: {
        usdt_network: user[0].usdt_network,
        usdt_address: user[0].usdt_address,
        name: user[0].name,
        email: user[0].email
      }
    });
  } catch (err) {
    console.error("Get user USDT info error:", err);
    res.status(500).json({
      error: "Failed to get user USDT information",
      details: process.env.NODE_ENV === "development" ? err.message : null
    });
  }
};



// Di auth.controller.js atau user.controller.js
exports.updateUserUSDT = async (req, res) => {
  try {
    const userId = req.user.id;
    const { usdt_network, usdt_address } = req.body;

    // Validasi input
    if (!usdt_network || !usdt_address) {
      return res.status(400).json({
        error: "USDT network and address are required",
        code: "MISSING_FIELDS"
      });
    }

    // Validasi network
    const allowedNetworks = ["TRC20", "ERC20", "BEP20"];
    if (!allowedNetworks.includes(usdt_network)) {
      return res.status(400).json({
        error: "Invalid USDT network",
        code: "INVALID_NETWORK",
        allowed: allowedNetworks
      });
    }

    // Update user USDT information
    await db.query(
      `UPDATE users 
       SET usdt_network = ?, usdt_address = ?, updated_at = NOW() 
       WHERE id = ?`,
      [usdt_network, usdt_address, userId]
    );

    res.json({
      success: true,
      message: "USDT information updated successfully",
      data: {
        usdt_network,
        usdt_address
      }
    });
  } catch (err) {
    console.error("Update USDT error:", err);
    res.status(500).json({
      error: "Failed to update USDT information",
      details: process.env.NODE_ENV === "development" ? err.message : null
    });
  }
};


// Get admin wallets
exports.getAdminWallets = async (req, res) => {
  try {
    const [wallets] = await db.query(
      "SELECT * FROM admin_wallets ORDER BY network, is_default DESC, created_at DESC"
    );
    
    res.json({
      success: true,
      data: wallets
    });
  } catch (err) {
    console.error("Get admin wallets error:", err);
    res.status(500).json({
      error: "Failed to get admin wallets",
      details: process.env.NODE_ENV === "development" ? err.message : null
    });
  }
};

// Set default wallet
exports.setDefaultWallet = async (req, res) => {
  try {
    const { network, wallet_id } = req.body;
    
    // Validasi input
    if (!network || !wallet_id) {
      return res.status(400).json({
        error: "Network and wallet_id are required",
        code: "MISSING_FIELDS"
      });
    }
    
    // Mulai transaction
    await db.query("START TRANSACTION");
    
    // Reset semua default wallets untuk network ini
    await db.query(
      "UPDATE admin_wallets SET is_default = 0 WHERE network = ?",
      [network]
    );
    
    // Set wallet yang dipilih sebagai default
    const [result] = await db.query(
      "UPDATE admin_wallets SET is_default = 1 WHERE id = ? AND network = ?",
      [wallet_id, network]
    );
    
    if (result.affectedRows === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({
        error: "Wallet not found or network mismatch",
        code: "WALLET_NOT_FOUND"
      });
    }
    
    await db.query("COMMIT");
    
    res.json({
      success: true,
      message: "Default wallet updated successfully"
    });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("Set default wallet error:", err);
    res.status(500).json({
      error: "Failed to set default wallet",
      details: process.env.NODE_ENV === "development" ? err.message : null
    });
  }
};

// Add admin wallet
exports.addAdminWallet = async (req, res) => {
  try {
    const { network, address } = req.body;
    
    // Validasi input
    if (!network || !address) {
      return res.status(400).json({
        error: "Network and address are required",
        code: "MISSING_FIELDS"
      });
    }
    
    // Validasi network
    const allowedNetworks = ["TRC20", "ERC20", "BEP20"];
    if (!allowedNetworks.includes(network)) {
      return res.status(400).json({
        error: "Invalid network",
        code: "INVALID_NETWORK",
        allowed: allowedNetworks
      });
    }
    
    // Insert wallet baru
    const [result] = await db.query(
      "INSERT INTO admin_wallets (network, address) VALUES (?, ?)",
      [network, address]
    );
    
    res.json({
      success: true,
      message: "Wallet added successfully",
      data: {
        id: result.insertId,
        network,
        address
      }
    });
  } catch (err) {
    console.error("Add admin wallet error:", err);
    res.status(500).json({
      error: "Failed to add wallet",
      details: process.env.NODE_ENV === "development" ? err.message : null
    });
  }
};

// Delete admin wallet
exports.deleteAdminWallet = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.query(
      "DELETE FROM admin_wallets WHERE id = ?",
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Wallet not found",
        code: "WALLET_NOT_FOUND"
      });
    }
    
    res.json({
      success: true,
      message: "Wallet deleted successfully"
    });
  } catch (err) {
    console.error("Delete admin wallet error:", err);
    res.status(500).json({
      error: "Failed to delete wallet",
      details: process.env.NODE_ENV === "development" ? err.message : null
    });
  }
};