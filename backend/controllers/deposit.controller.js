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


// Generate deposit address based on network - USING CREDIT RATE FROM DATABASE
exports.generateDepositAddress = async (req, res) => {
  const { network, amount } = req.body;

  try {
    // Validate network
    if (!["TRC20", "ERC20", "BEP20"].includes(network)) {
      return res.status(400).json({ error: "Invalid network" });
    }

    // Validate amount
    const amountValue = parseFloat(amount);
    if (amountValue < 10.0) {
      return res.status(400).json({ error: "Minimum deposit is 10 USDT" });
    }

    // CARI CREDIT RATE DARI DATABASE
    const [creditSetting] = await db.query(
      `SELECT credits FROM deposit_amounts WHERE value = ? AND status = 'active'`,
      [amountValue]
    );

    let creditRate;
    let finalCredit;
    
    if (creditSetting.length > 0) {
      // Gunakan credit rate dari database
      creditRate = creditSetting[0].credits;
      console.log(`Using credit rate from database: ${creditRate} for amount: ${amountValue}`);
      
      // HITUNG FINAL CREDIT = AMOUNT * CREDIT RATE
      finalCredit = creditRate;
    } else {
      // Fallback: cari rate terdekat jika amount tidak exact match
      const [closestRate] = await db.query(
        `SELECT value, credits FROM deposit_amounts 
         WHERE status = 'active' AND value <= ?
         ORDER BY value DESC LIMIT 1`,
        [amountValue]
      );
      
      if (closestRate.length > 0) {
        // Hitung secara proporsional berdasarkan rate terdekat
        const ratePerDollar = closestRate[0].credits / parseFloat(closestRate[0].value);
        creditRate = ratePerDollar;
        finalCredit = ratePerDollar;
        console.log(`Using proportional credit: ${finalCredit} based on closest rate`);
      } else {
        // Ultimate fallback: default calculation
        creditRate = 100;
        finalCredit = amountValue * 100;
        console.log(`Using default credit calculation: ${finalCredit}`);
      }
    }

    // Get default wallet address from admin_wallets
    const [wallet] = await db.query(
      `SELECT address FROM admin_wallets 
       WHERE network = ? AND is_default = 1 
       ORDER BY created_at DESC LIMIT 1`,
      [network]
    );

    if (!wallet.length) {
      return res.status(400).json({
        error: `No default wallet configured for ${network} network`,
        code: "NO_DEFAULT_WALLET"
      });
    }

    const address = wallet[0].address;
    const memo = `UID${req.user.id}`;

    // Create pending deposit record DENGAN FINAL CREDIT (amount * credit rate)
    const [result] = await db.query(
      `INSERT INTO deposits 
       (user_id, amount, network, destination_address, memo, status, credit)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      [req.user.id, amountValue, network, address, memo, finalCredit] // ← finalCredit disimpan
    );

    res.json({
      success: true,
      deposit_id: result.insertId,
      address,
      memo,
      note: "Please send exact amount to this address",
      expires_in: 3600,
      credit: finalCredit, // KIRIMKAN FINAL CREDIT
      credit_rate: creditRate, // KIRIMKAN JUGA CREDIT RATE jika diperlukan
      amount: amountValue
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
async function processApprovedDeposit(depositId, userId, amount, credit) {
  try {
    // Update user balance dan total_credit
    await db.query(
      `UPDATE users 
       SET balance = COALESCE(balance, 0) + ?, 
           total_credit = COALESCE(total_credit, 0) + ?
       WHERE id = ?`,
      [amount, credit, userId]
    );
    // PROSES KOMISI REFERRAL - HANYA JIKA DEPOSIT DISETUJUI
    try {
      // Cek apakah user memiliki referrer
      const [user] = await db.query(
        'SELECT referred_by FROM users WHERE id = ?',
        [userId]
      );
      
      if (user.length && user[0].referred_by) {
        const referrerId = user[0].referred_by;
        
        // Dapatkan setting komisi aktif
        const [activeSetting] = await db.query(
          'SELECT * FROM referral_commission_settings WHERE is_active = 1 LIMIT 1'
        );
        
        if (activeSetting.length > 0) {
          const setting = activeSetting[0];
          let commissionAmount = 0;
          
          // Hitung komisi berdasarkan setting
          if (setting.commission_type === 'percent') {
            commissionAmount = amount * setting.commission_value;
          } else {
            commissionAmount = setting.commission_value;
          }
          
          // Pastikan deposit memenuhi minimum
          if (amount >= setting.min_deposit && commissionAmount > 0) {
            // Tambahkan komisi ke referrer
            await db.query(
              'INSERT INTO commissions (user_id, amount, commission_setting_id, status) VALUES (?, ?, ?, "pending")',
              [referrerId, commissionAmount, setting.id]
            );
            
            console.log(`Referral commission awarded: $${commissionAmount} to user ${referrerId} for deposit ${depositId}`);
          }
        }
      }
    } catch (commissionErr) {
      console.error('Failed to process referral commission:', commissionErr);
      // Jangan gagalkan deposit hanya karena komisi gagal
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
// === Controller untuk submit evidence (opsional) ===
exports.submitDepositEvidence = async (req, res) => {
  try {
    const { deposit_id, tx_hash } = req.body;
    const proofFile = req.file ? req.file.path : null;

    // Validasi: minimal salah satu harus diisi
    if (!deposit_id || (!tx_hash && !proofFile)) {
      return res.status(400).json({ 
        message: "Deposit ID wajib diisi, dan minimal salah satu: Tx hash atau file bukti" 
      });
    }

    // Cek apakah deposit exists dan status masih pending
    const [depositCheck] = await db.query(
      `SELECT status FROM deposits WHERE id = ?`,
      [deposit_id]
    );

    if (!depositCheck.length) {
      return res.status(404).json({ message: "Deposit tidak ditemukan" });
    }

    if (depositCheck[0].status !== 'pending') {
      return res.status(400).json({ 
        message: "Deposit sudah diproses, tidak dapat mengupload bukti lagi" 
      });
    }

    // Update deposit - langsung ke status 'checking'
    const [result] = await db.query(
      `UPDATE deposits 
       SET tx_hash = ?, 
           proof_file = ?, 
           status = 'checking', 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [tx_hash || null, proofFile || null, deposit_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Deposit tidak ditemukan" });
    }

    res.status(200).json({ 
      message: "Deposit evidence submitted, waiting for checking", 
      depositId: deposit_id,
      status: 'checking'
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
      const amount = parseFloat(deposit[0].amount);
      const credit = parseFloat(deposit[0].credit); // Ambil credit dari deposit

      // 1. Update user balance dan total_credit
      await db.query(
        `UPDATE users 
         SET balance = COALESCE(balance, 0) + ?, 
             total_credit = COALESCE(total_credit, 0) + ?
         WHERE id = ?`,
        [amount, credit, userId]
      );

      // 2. PROSES KOMISI REFERRAL
      try {
        const { processReferralCommission } = require('./referral.controller');
        const commissionResult = await processReferralCommission(userId, amount);
        
        if (commissionResult) {
          console.log(`Referral commission awarded: $${commissionResult.commissionAmount} to user ${commissionResult.referrerId}`);
          
          // 3. CHECK AND UPDATE COMMISSION STATUS FOR THE REFERRER
          try {
            const { checkAndUpdateCommissionStatus } = require('./referral.controller');
            await checkAndUpdateCommissionStatus(commissionResult.referrerId);
          } catch (statusErr) {
            console.error('Failed to check commission status:', statusErr);
            // Jangan gagalkan proses hanya karena pemeriksaan status gagal
          }
        } else {
          console.log('No referral commission processed for this deposit');
        }
      } catch (commissionErr) {
        console.error('Failed to process referral commission:', commissionErr);
        // Jangan gagalkan deposit hanya karena komisi gagal
      }
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

// Enhanced deposit controller methods - USING ADMIN WALLETS
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
    const minAmount = is_custom ? 10.0 : 10.0;
    if (parseFloat(amount) < minAmount) {
      return res.status(400).json({
        error: `Minimum deposit is ${minAmount} USDT`,
        minimum: minAmount,
      });
    }

    // Calculate credit (1 USDT = 100 credit)
    const credit = parseFloat(amount) * 100;

    // Get default wallet address from admin_wallets for the specified network
    const [wallet] = await db.query(
      `SELECT address FROM admin_wallets 
       WHERE network = ? AND is_default = 1 
       ORDER BY created_at DESC LIMIT 1`,
      [network]
    );

    if (!wallet.length) {
      return res.status(400).json({
        error: `No default wallet configured for ${network} network`,
        code: "NO_DEFAULT_WALLET"
      });
    }

    const address = wallet[0].address;
    const memo = `UID${req.user.id}`;

    // Create deposit record
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
      credit: credit,
      note: "Please send exact amount to this address",
      expires_in: 3600,
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



// di deposit.controller.js
exports.cancelDeposit = async (req, res) => {
  const { deposit_id } = req.params;
  const userId = req.user.id;

  try {
    // Cek apakah deposit milik user dan status masih pending
    const [deposit] = await db.query(
      `SELECT * FROM deposits WHERE id = ? AND user_id = ? AND status = 'pending'`,
      [deposit_id, userId]
    );

    if (!deposit.length) {
      return res.status(404).json({
        error: "Deposit not found or cannot be cancelled",
        code: "DEPOSIT_NOT_CANCELLABLE"
      });
    }

    // Update status menjadi cancelled
    await db.query(
      `UPDATE deposits SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [deposit_id]
    );

    res.json({
      success: true,
      message: "Deposit cancelled successfully"
    });
  } catch (err) {
    console.error("Cancel deposit error:", err);
    res.status(500).json({
      error: "Failed to cancel deposit",
      details: process.env.NODE_ENV === "development" ? err.message : null
    });
  }
};


// Admin: Delete deposit
exports.deleteDeposit = async (req, res) => {
  const { id } = req.params;

  try {
    // Validasi input
    if (!id) {
      return res.status(400).json({
        error: "Deposit ID is required",
        code: "MISSING_DEPOSIT_ID"
      });
    }

    // Cek apakah deposit exists
    const [deposit] = await db.query(
      `SELECT * FROM deposits WHERE id = ?`,
      [id]
    );

    if (!deposit.length) {
      return res.status(404).json({
        error: "Deposit not found",
        code: "DEPOSIT_NOT_FOUND"
      });
    }

    const depositData = deposit[0];

    // Validasi: jangan izinkan menghapus deposit yang sudah approved/completed
    if (depositData.status === 'approved' || depositData.status === 'completed') {
      return res.status(400).json({
        error: "Cannot delete approved/completed deposits",
        code: "CANNOT_DELETE_APPROVED_DEPOSIT"
      });
    }

    // Mulai transaction untuk memastikan konsistensi data
    await db.query("START TRANSACTION");

    try {
      // Hapus deposit
      const [result] = await db.query(
        `DELETE FROM deposits WHERE id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        await db.query("ROLLBACK");
        return res.status(404).json({
          error: "Deposit not found",
          code: "DEPOSIT_NOT_FOUND"
        });
      }

      // Jika deposit memiliki bukti transfer, hapus file-nya (opsional)
      if (depositData.proof_file) {
        const fs = require('fs');
        const path = require('path');
        
        const filePath = path.join(__dirname, '..', depositData.proof_file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await db.query("COMMIT");

      res.json({
        success: true,
        message: "Deposit deleted successfully",
        deleted_deposit_id: id
      });

    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }

  } catch (err) {
    console.error("Delete deposit error:", err);
    res.status(500).json({
      error: "Failed to delete deposit",
      details: process.env.NODE_ENV === "development" ? err.message : null,
      code: "DELETE_DEPOSIT_ERROR"
    });
  }
};


// Middleware untuk check wallet availability
exports.checkWalletAvailability = async (req, res, next) => {
  const { network } = req.body;
  
  try {
    const [wallet] = await db.query(
      `SELECT COUNT(*) as count FROM admin_wallets 
       WHERE network = ? AND is_default = 1`,
      [network]
    );
    
    if (wallet[0].count === 0) {
      return res.status(400).json({
        error: `No wallet available for ${network} network. Please contact admin.`,
        code: "WALLET_NOT_AVAILABLE"
      });
    }
    
    next();
  } catch (err) {
    console.error("Check wallet availability error:", err);
    res.status(500).json({
      error: "Failed to check wallet availability",
      details: process.env.NODE_ENV === "development" ? err.message : null,
    });
  }
};



// Controller functions
exports.getUserUSDTAddresses = async (req, res) => {
  try {
    const [addresses] = await db.query(
      `SELECT * FROM user_usdt_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: addresses });
  } catch (err) {
    console.error("Error fetching USDT addresses:", err);
    res.status(500).json({ error: "Failed to fetch USDT addresses" });
  }
};

exports.addUSDTAddress = async (req, res) => {
  const { network, address, is_default = false } = req.body;
  
  try {
    // Validasi network
    if (!["TRC20", "ERC20", "BEP20"].includes(network)) {
      return res.status(400).json({ error: "Invalid network" });
    }

    // Validasi address
    if (!address || address.length < 10) {
      return res.status(400).json({ error: "Invalid USDT address" });
    }

    // Jika set sebagai default, reset default lainnya
    if (is_default) {
      await db.query(
        `UPDATE user_usdt_addresses SET is_default = 0 WHERE user_id = ?`,
        [req.user.id]
      );
    }

    const [result] = await db.query(
      `INSERT INTO user_usdt_addresses (user_id, network, address, is_default)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, network, address, is_default]
    );

    res.json({ 
      success: true, 
      message: "USDT address added successfully",
      id: result.insertId
    });
  } catch (err) {
    console.error("Error adding USDT address:", err);
    res.status(500).json({ error: "Failed to add USDT address" });
  }
};



// Update USDT Address
exports.updateUSDTAddress = async (req, res) => {
  const { id } = req.params;
  const { network, address, is_default } = req.body;

  try {
    // Validasi input
    if (!network || !address) {
      return res.status(400).json({ error: "Network and address are required" });
    }

    // Validasi network
    if (!["TRC20", "ERC20", "BEP20"].includes(network)) {
      return res.status(400).json({ error: "Invalid network" });
    }

    // Validasi address
    if (address.length < 10) {
      return res.status(400).json({ error: "Invalid USDT address" });
    }

    // Cek apakah address milik user
    const [existingAddress] = await db.query(
      `SELECT * FROM user_usdt_addresses WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );

    if (existingAddress.length === 0) {
      return res.status(404).json({ error: "USDT address not found" });
    }

    // Jika set sebagai default, reset default lainnya
    if (is_default) {
      await db.query(
        `UPDATE user_usdt_addresses SET is_default = 0 WHERE user_id = ? AND id != ?`,
        [req.user.id, id]
      );
    }

    // Update address
    const [result] = await db.query(
      `UPDATE user_usdt_addresses 
       SET network = ?, address = ?, is_default = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [network, address, is_default || false, id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Failed to update USDT address" });
    }

    res.json({ 
      success: true, 
      message: "USDT address updated successfully" 
    });

  } catch (err) {
    console.error("Error updating USDT address:", err);
    res.status(500).json({ 
      error: "Failed to update USDT address",
      details: process.env.NODE_ENV === "development" ? err.message : null
    });
  }
};

// Delete USDT Address
exports.deleteUSDTAddress = async (req, res) => {
  const { id } = req.params;

  try {
    // Cek apakah address milik user
    const [existingAddress] = await db.query(
      `SELECT * FROM user_usdt_addresses WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );

    if (existingAddress.length === 0) {
      return res.status(404).json({ error: "USDT address not found" });
    }

    // Jangan izinkan menghapus jika hanya ada satu address
    const [userAddresses] = await db.query(
      `SELECT COUNT(*) as count FROM user_usdt_addresses WHERE user_id = ?`,
      [req.user.id]
    );

    if (userAddresses[0].count <= 1) {
      return res.status(400).json({ 
        error: "Cannot delete the only USDT address. Please add another address first." 
      });
    }

    // Jika yang dihapus adalah default, set address lain sebagai default
    if (existingAddress[0].is_default) {
      // Cari address lain untuk dijadikan default
      const [otherAddresses] = await db.query(
        `SELECT id FROM user_usdt_addresses 
         WHERE user_id = ? AND id != ? 
         ORDER BY created_at DESC LIMIT 1`,
        [req.user.id, id]
      );

      if (otherAddresses.length > 0) {
        await db.query(
          `UPDATE user_usdt_addresses SET is_default = 1 WHERE id = ?`,
          [otherAddresses[0].id]
        );
      }
    }

    // Hapus address
    const [result] = await db.query(
      `DELETE FROM user_usdt_addresses WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Failed to delete USDT address" });
    }

    res.json({ 
      success: true, 
      message: "USDT address deleted successfully" 
    });

  } catch (err) {
    console.error("Error deleting USDT address:", err);
    res.status(500).json({ 
      error: "Failed to delete USDT address",
      details: process.env.NODE_ENV === "development" ? err.message : null
    });
  }
};

// Set Default USDT Address
exports.setDefaultUSDTAddress = async (req, res) => {
  const { id } = req.params;

  try {
    // Cek apakah address milik user
    const [existingAddress] = await db.query(
      `SELECT * FROM user_usdt_addresses WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );

    if (existingAddress.length === 0) {
      return res.status(404).json({ error: "USDT address not found" });
    }

    // Reset semua default addresses
    await db.query(
      `UPDATE user_usdt_addresses SET is_default = 0 WHERE user_id = ?`,
      [req.user.id]
    );

    // Set address sebagai default
    const [result] = await db.query(
      `UPDATE user_usdt_addresses SET is_default = 1 WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Failed to set default USDT address" });
    }

    res.json({ 
      success: true, 
      message: "USDT address set as default successfully" 
    });

  } catch (err) {
    console.error("Error setting default USDT address:", err);
    res.status(500).json({ 
      error: "Failed to set default USDT address",
      details: process.env.NODE_ENV === "development" ? err.message : null
    });
  }
};

// Get User USDT Addresses
exports.getUserUSDTAddresses = async (req, res) => {
  try {
    const [addresses] = await db.query(
      `SELECT * FROM user_usdt_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: addresses });
  } catch (err) {
    console.error("Error fetching USDT addresses:", err);
    res.status(500).json({ 
      error: "Failed to fetch USDT addresses",
      details: process.env.NODE_ENV === "development" ? err.message : null
    });
  }
};

// Add USDT Address
exports.addUSDTAddress = async (req, res) => {
  const { network, address, is_default = false } = req.body;
  
  try {
    // Validasi network
    if (!["TRC20", "ERC20", "BEP20"].includes(network)) {
      return res.status(400).json({ error: "Invalid network" });
    }

    // Validasi address
    if (!address || address.length < 10) {
      return res.status(400).json({ error: "Invalid USDT address" });
    }

    // Cek apakah network sudah ada untuk user ini
    const [existingNetwork] = await db.query(
      `SELECT * FROM user_usdt_addresses WHERE user_id = ? AND network = ?`,
      [req.user.id, network]
    );

    if (existingNetwork.length > 0) {
      return res.status(400).json({ 
        error: `You already have a ${network} address. Please update the existing one instead.` 
      });
    }

    // Jika set sebagai default, reset default lainnya
    if (is_default) {
      await db.query(
        `UPDATE user_usdt_addresses SET is_default = 0 WHERE user_id = ?`,
        [req.user.id]
      );
    }

    const [result] = await db.query(
      `INSERT INTO user_usdt_addresses (user_id, network, address, is_default)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, network, address, is_default]
    );

    res.json({ 
      success: true, 
      message: "USDT address added successfully",
      id: result.insertId
    });
  } catch (err) {
    console.error("Error adding USDT address:", err);
    res.status(500).json({ 
      error: "Failed to add USDT address",
      details: process.env.NODE_ENV === "development" ? err.message : null
    });
  }
};


// Get total available credit for user
exports.getUserTotalCredit = async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await db.query(
      `SELECT 
         COALESCE(total_credit, 0) as total_credit,
         COALESCE(balance, 0) as balance
       FROM users 
       WHERE id = ?`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        total_credit: parseFloat(result[0].total_credit || 0),
        balance: parseFloat(result[0].balance || 0)
      }
    });
  } catch (err) {
    console.error("Get user credit error:", err);
    res.status(500).json({
      error: "Failed to get user credit",
      details: process.env.NODE_ENV === "development" ? err.message : null
    });
  }
};


// Di deposit.controller.js
exports.getCreditUsageHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [history] = await db.query(`
      SELECT 
        cud.*,
        cm.campaign_name,
        cm.total_cost,
        cm.created_at as campaign_date
      FROM credit_usage_details cud
      LEFT JOIN campaigns cm ON cud.campaign_id = cm.id
      WHERE cud.user_id = ?
      ORDER BY cud.created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      data: history
    });
  } catch (err) {
    console.error("Get credit history error:", err);
    res.status(500).json({
      error: "Failed to get credit history",
      details: process.env.NODE_ENV === "development" ? err.message : null
    });
  }
};



// deposit.controller.js
exports.getUserCreditByAdmin = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Validasi admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: "Access denied. Admin only.",
        code: "ADMIN_ACCESS_REQUIRED"
      });
    }

    const [result] = await db.query(
      `SELECT 
         COALESCE(total_credit, 0) as total_credit,
         COALESCE(balance, 0) as balance,
         username,
         email
       FROM users 
       WHERE id = ?`,
      [user_id]
    );

    if (!result.length) {
      return res.status(404).json({
        error: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    res.json({
      success: true,
      data: {
        total_credit: parseFloat(result[0].total_credit || 0),
        balance: parseFloat(result[0].balance || 0),
        username: result[0].username,
        email: result[0].email
      }
    });
  } catch (err) {
    console.error("Get user credit by admin error:", err);
    res.status(500).json({
      error: "Failed to get user credit",
      details: process.env.NODE_ENV === "development" ? err.message : null
    });
  }
};