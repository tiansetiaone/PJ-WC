const db = require('../config/db');
const { validateAddress, generateDepositAddress } = require('../utils/blockchain');

// Generate deposit address based on network
exports.generateDepositAddress = async (req, res) => {
  const { network, amount } = req.body;
  
  try {
    // Validate network
    if (!['TRC20', 'ERC20', 'BEP20'].includes(network)) {
      return res.status(400).json({ error: 'Invalid network' });
    }

    // Validate amount
    if (parseFloat(amount) < 10.00) {
      return res.status(400).json({ error: 'Minimum deposit is 10 USDT' });
    }

    // Generate address (simulation)
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
      note: 'Please send exact amount to this address',
      expires_in: 3600 // 1 hour expiration
    });

  } catch (err) {
    console.error('Generate address error:', err);
    res.status(500).json({ 
      error: 'Failed to generate deposit address',
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};

// Submit deposit evidence (tx_hash)
exports.submitDepositEvidence = async (req, res) => {
  const { deposit_id, tx_hash } = req.body;
  const userId = req.user.id;

  try {
    // Validate input
    if (!deposit_id || !tx_hash) {
      return res.status(400).json({ 
        error: 'Deposit ID and TX Hash are required' 
      });
    }

    // Verify deposit belongs to user
    const [deposit] = await db.query(
      `SELECT * FROM deposits 
       WHERE id = ? AND user_id = ? AND status = 'pending'`,
      [deposit_id, userId]
    );

    if (!deposit.length) {
      return res.status(404).json({ error: 'Deposit not found or already processed' });
    }

    // Update deposit with tx_hash and change status
    await db.query(
      `UPDATE deposits 
       SET tx_hash = ?, status = 'checking', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [tx_hash, deposit_id]
    );

    res.json({
      success: true,
      message: 'Deposit submitted for verification'
    });

  } catch (err) {
    console.error('Submit evidence error:', err);
    res.status(500).json({ 
      error: 'Failed to submit deposit evidence',
      details: process.env.NODE_ENV === 'development' ? err.message : null
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
    const [total] = await db.query(
      `SELECT COUNT(*) as count FROM deposits WHERE user_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      data: rows.map(row => ({
        ...row,
        amount: `$${Number(row.amount).toFixed(3)}`, // Convert to number first
        status: getStatusDisplay(row.status)
      })),
      meta: {
        total: total[0].count,
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_pages: Math.ceil(total[0].count / limit)
      }
    });

  } catch (err) {
    console.error('Get deposits error:', err);
    res.status(500).json({ 
      error: 'Failed to get deposit history',
      details: process.env.NODE_ENV === 'development' ? {
        message: err.message,
        sql: err.sql,
        stack: err.stack
      } : null
    });
  }
};

// Helper function to convert status to display text
function getStatusDisplay(status) {
  const statusMap = {
    'pending': 'Pending Transaction',
    'checking': 'Checking Deposit',
    'approved': 'Deposit Success',
    'rejected': 'Deposit Failed'
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
            data: rows.map(row => ({
                ...row,
                top_up: `$${Number(row.top_up).toFixed(2)}`,
                status: getStatusDisplay(row.status)
            })),
            meta: {
                total: total[0].count,
                current_page: parseInt(page),
                per_page: parseInt(limit),
                total_pages: Math.ceil(total[0].count / limit)
            }
        });

    } catch (err) {
        console.error('Get deposit requests error:', err);
        res.status(500).json({
            error: 'Failed to get deposit requests',
            details: process.env.NODE_ENV === 'development' ? err.message : null
        });
    }
};

// Admin: Approve/Reject deposit
exports.processDeposit = async (req, res) => {
    const { deposit_id, action } = req.body;

    try {
        // Validate input
        if (!deposit_id || !['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                error: 'Invalid deposit ID or action'
            });
        }

        // Check if deposit exists and is in checking status
        const [deposit] = await db.query(
            `SELECT * FROM deposits WHERE id = ? AND status = 'checking'`,
            [deposit_id]
        );

        if (!deposit.length) {
            return res.status(404).json({
                error: 'Deposit not found or already processed'
            });
        }

        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        
        // Update deposit status
        await db.query(
            `UPDATE deposits SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [newStatus, deposit_id]
        );

        // If approved, credit user's balance
        if (action === 'approve') {
            const userId = deposit[0].user_id;
            const amount = deposit[0].amount;
            
            await db.query(
                `UPDATE users SET balance = balance + ? WHERE id = ?`,
                [amount, userId]
            );
        }

        res.json({
            success: true,
            message: `Deposit ${newStatus} successfully`
        });

    } catch (err) {
        console.error('Process deposit error:', err);
        res.status(500).json({
            error: 'Failed to process deposit',
            details: process.env.NODE_ENV === 'development' ? err.message : null
        });
    }
};