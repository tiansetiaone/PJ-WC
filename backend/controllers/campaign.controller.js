const db = require("../config/db");
const fs = require("fs");
const path = require("path");
const { validatePhoneNumbers } = require("../utils/validation");

// Constants
const MAX_TEXT_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TEXT_TYPES = ["text/plain"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg"];

// CREATE CAMPAIGN
// CREATE CAMPAIGN dengan pengecekan saldo
exports.createCampaign = async (req, res) => {
  const { campaign_name, campaign_date, message, campaign_type } = req.body;
  const user_id = req.user?.id;
  let image_url = null;

  try {
    // Validate required fields
    if (!campaign_name || !campaign_date || !message || !campaign_type) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["campaign_name", "campaign_date", "message", "campaign_type"],
      });
    }

    // Validate campaign type
    if (!["whatsapp", "sms"].includes(campaign_type)) {
      return res.status(400).json({
        error: "Invalid campaign type",
        allowed: ["whatsapp", "sms"],
      });
    }

     // CEK SALDO USER sebelum membuat campaign
    const [userBalance] = await db.query(
      `SELECT balance FROM users WHERE id = ?`,
      [user_id]
    );

    if (!userBalance.length || parseFloat(userBalance[0].balance) <= 0) {
      return res.status(400).json({
        error: "Insufficient balance",
        message: "You don't have enough credit to create a campaign. Please top up first.",
      });
    }

    // Cek kalau ada file gambar
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    // Insert campaign (tanpa total_cost dulu)
    const [result] = await db.query(
      `INSERT INTO campaigns 
       (user_id, campaign_name, campaign_date, message, image_url, campaign_type, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [user_id, campaign_name, campaign_date, message, image_url, campaign_type]
    );

    res.status(201).json({
      success: true,
      message: "Campaign created successfully. Please upload numbers to calculate cost.",
      campaign_id: result.insertId,
    });
  } catch (err) {
    console.error("Create campaign error:", err);
    res.status(500).json({
      error: "Failed to create campaign",
      details: process.env.NODE_ENV === "development" ? err.message : null,
    });
  }
};

// UPLOAD NUMBERS TXT
exports.uploadNumbers = async (req, res) => {
  try {
    const { id } = req.params; // campaign_id
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const filePath = path.join(req.file.destination, req.file.filename);
    const content = fs.readFileSync(filePath, "utf8");

    // parse numbers (split by newline / space / comma)
    const numbers = content
      .split(/[\n, ]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    // Insert ke campaign_numbers
    for (let phone of numbers) {
      await db.query(
        "INSERT INTO campaign_numbers (campaign_id, phone_number, status) VALUES (?, ?, ?)",
        [id, phone, "success"]
      );
    }

    return res.json({ success: true, inserted: numbers.length });
  } catch (err) {
    console.error("Upload numbers error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to upload numbers",
      details: process.env.NODE_ENV === "development" ? err.message : null,
    });
  }
};


exports.getUserCampaigns = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        id, campaign_name, campaign_date, 
        campaign_type, status, created_at,
        message,
        CASE 
          WHEN campaign_type = 'whatsapp' THEN image_url 
          ELSE NULL 
        END as image_url
       FROM campaigns 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("Get campaigns error:", err);
    res.status(500).json({
      error: "Failed to fetch campaigns",
      details: process.env.NODE_ENV === "development" ? err.message : null,
    });
  }
};

// UPLOAD NUMBERS dengan perhitungan biaya
exports.uploadCampaignNumbers = async (req, res) => {
  const { campaignId } = req.params;
  const user_id = req.user.id;

  try {
    // 1. Verify campaign ownership
    const [campaign] = await db.query(
      `SELECT id, campaign_type, user_id FROM campaigns 
       WHERE id = ? AND user_id = ?`,
      [campaignId, user_id]
    );

    if (!campaign.length) {
      return res.status(404).json({
        error: "Campaign not found or access denied",
      });
    }

    const campaignType = campaign[0].campaign_type;

    // 2. File validation
    if (!req.file) {
      return res.status(400).json({ error: "Please upload a TXT file" });
    }

    // 3. Process file
    const fileContent = fs.readFileSync(req.file.path, "utf8");
    const numbers = fileContent
      .split(/\r?\n/)
      .map((num) => num.trim())
      .filter((num) => num !== "");

    // 4. Validate phone numbers
    const { validNumbers, invalidNumbers } = validatePhoneNumbers(numbers, campaignType);

    if (invalidNumbers.length > 0) {
      return res.status(400).json({
        error: "Some phone numbers are invalid",
        invalidNumbers,
        validCount: validNumbers.length,
        invalidCount: invalidNumbers.length,
      });
    }

    const totalNumbers = validNumbers.length;

    // 5. Hitung biaya campaign
    const pricePerNumber = await getCampaignPrice(campaignType, totalNumbers);
    const totalCost = pricePerNumber * totalNumbers;

    // 6. Cek saldo user
    const [user] = await db.query(
      `SELECT balance FROM users WHERE id = ?`,
      [user_id]
    );

    const userBalance = parseFloat(user[0].balance || 0);

    if (userBalance < totalCost) {
      return res.status(400).json({
        error: "Insufficient balance",
        message: `You need $${totalCost.toFixed(4)} but only have $${userBalance.toFixed(4)}`,
        required: totalCost,
        current_balance: userBalance
      });
    }

    // 7. Save to database
    await db.query(
      `INSERT INTO campaign_numbers (campaign_id, phone_number) 
       VALUES ?`,
      [validNumbers.map((num) => [campaignId, num])]
    );

    // 8. Update campaign dengan informasi biaya
    await db.query(
      `UPDATE campaigns 
       SET total_numbers = ?, 
           price_per_number = ?, 
           total_cost = ?,
           status = 'on_process'
       WHERE id = ?`,
      [totalNumbers, pricePerNumber, totalCost, campaignId]
    );

    // 9. Kurangi saldo user (pending sampai campaign approved)
    // Saldo akan dipotong saat campaign di-approve oleh admin

    // Cleanup
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Phone numbers uploaded successfully`,
      totalUploaded: totalNumbers,
      pricePerNumber: pricePerNumber,
      totalCost: totalCost,
      campaignType: campaignType,
    });
  } catch (err) {
    console.error("Upload error:", err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: "Failed to process numbers" });
  }
};


exports.uploadCampaignNumbersRaw = async (req, res) => {
  const { campaignId } = req.params;
  const user_id = req.user.id;

  try {
    // 1. Verify campaign ownership
    const [campaign] = await db.query(
      `SELECT id, campaign_type FROM campaigns 
       WHERE id = ? AND user_id = ?`,
      [campaignId, user_id]
    );

    if (!campaign.length) {
      return res.status(404).json({
        error: "Campaign not found or access denied",
      });
    }

    const campaignType = campaign[0].campaign_type;

    // 2. Get raw text from body
    let numbers = [];
    if (req.body && typeof req.body === 'string') {
      numbers = req.body.split(/\r?\n/)
        .map((num) => num.trim())
        .filter((num) => num !== "");
    } else if (req.body && Array.isArray(req.body)) {
      numbers = req.body;
    }

    if (numbers.length === 0) {
      return res.status(400).json({ 
        error: "No phone numbers found in request body" 
      });
    }

    // 3. Validate phone numbers
    const { validNumbers, invalidNumbers } = validatePhoneNumbers(numbers, campaignType);

    if (invalidNumbers.length > 0) {
      return res.status(400).json({
        error: "Some phone numbers are invalid",
        invalidNumbers,
        validCount: validNumbers.length,
        invalidCount: invalidNumbers.length,
      });
    }

    // 4. Save to database
    await db.query(
      `INSERT INTO campaign_numbers (campaign_id, phone_number) 
       VALUES ?`,
      [validNumbers.map((num) => [campaignId, num])]
    );

    // 5. Update campaign status
    await db.query(
      `UPDATE campaigns SET status = 'on_process' 
       WHERE id = ?`,
      [campaignId]
    );

    res.json({
      success: true,
      message: `Phone numbers uploaded successfully for ${campaignType} campaign`,
      totalUploaded: validNumbers.length,
      campaignType: campaignType,
    });
  } catch (err) {
    console.error("Upload raw numbers error:", err);
    res.status(500).json({ error: "Failed to process numbers" });
  }
};

exports.getCampaignNumbers = async (req, res) => {
  const { campaignId } = req.params;
  const user_id = req.user.id;

  try {
    // Verify campaign ownership
    const [campaign] = await db.query(`SELECT id FROM campaigns WHERE id = ? AND user_id = ?`, [campaignId, user_id]);

    if (!campaign.length) {
      return res.status(404).json({
        error: "Campaign not found or access denied",
      });
    }

    const [numbers] = await db.query(
      `SELECT id, phone_number, status 
       FROM campaign_numbers 
       WHERE campaign_id = ?`,
      [campaignId]
    );

    res.json({
      success: true,
      data: numbers,
    });
  } catch (err) {
    console.error("Get campaign numbers error:", err);
    res.status(500).json({
      error: "Failed to fetch campaign numbers",
      details: process.env.NODE_ENV === "development" ? err.message : null,
    });
  }
};

// Should add endpoint to track processing status
exports.getCampaignStatus = async (req, res) => {
  const { campaignId } = req.params;
  const user_id = req.user.id;

  try {
    const [campaign] = await db.query(
      `SELECT 
        id, campaign_name, status, 
        campaign_type, created_at,
        (SELECT COUNT(*) FROM campaign_numbers WHERE campaign_id = ?) as total_numbers,
        (SELECT COUNT(*) FROM campaign_numbers WHERE campaign_id = ? AND status = 'success') as success_count
       FROM campaigns 
       WHERE id = ? AND user_id = ?`,
      [campaignId, campaignId, campaignId, user_id]
    );

    if (!campaign.length) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    res.json({
      success: true,
      data: campaign[0]
    });
  } catch (err) {
    console.error("Status check error:", err);
    res.status(500).json({ error: "Failed to check status" });
  }
};


// Admin - Get All Campaigns
exports.getAllCampaigns = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT 
      c.id, c.campaign_name, c.campaign_date, 
      c.campaign_type, c.status, c.created_at,
      c.message, c.image_url,
      u.name as creator_name,
      (SELECT COUNT(*) FROM campaign_numbers WHERE campaign_id = c.id) as total_numbers,
      (SELECT COUNT(*) FROM campaign_numbers WHERE campaign_id = c.id AND status = 'success') as success_count
     FROM campaigns c
     JOIN users u ON c.user_id = u.id`;

    const params = [];

    if (status) {
      query += ` WHERE c.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [campaigns] = await db.query(query, params);
    const [total] = await db.query(`SELECT COUNT(*) as total FROM campaigns`);

    res.json({
      success: true,
      data: campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0].total
      }
    });
  } catch (err) {
    console.error("Admin get campaigns error:", err);
    res.status(500).json({ 
      error: "Failed to fetch campaigns",
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};

// Admin - Get Campaign Details
exports.getCampaignDetails = async (req, res) => {
  const { campaignId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    let query = `
      SELECT 
        c.*, 
        u.name as creator_name,
        u.email as creator_email,
        (SELECT COUNT(*) FROM campaign_numbers WHERE campaign_id = c.id) as total_numbers,
        (SELECT COUNT(*) FROM campaign_numbers WHERE campaign_id = c.id AND status = 'success') as success_count
      FROM campaigns c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?`;
    
    let params = [campaignId];

    if (userRole !== "admin") {
      // kalau user biasa, batasi hanya campaign miliknya
      query += " AND c.user_id = ?";
      params.push(userId);
    }

    const [campaign] = await db.query(query, params);

    if (!campaign.length) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const [numbers] = await db.query(
      `SELECT id, phone_number, status 
       FROM campaign_numbers 
       WHERE campaign_id = ?`,
      [campaignId]
    );

    res.json({
      success: true,
      data: {
        ...campaign[0],
        numbers
      }
    });
  } catch (err) {
    console.error("getCampaignDetails error:", err);
    res.status(500).json({ 
      error: "Failed to fetch campaign details",
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};

// Admin - Update Campaign Status
exports.updateCampaignStatus = async (req, res) => {
  const { campaignId } = req.params;
  const { status } = req.body;

  try {
    if (!['on_process', 'success', 'failed'].includes(status)) {
      return res.status(400).json({ 
        error: "Invalid status",
        allowed: ['on_process', 'success', 'failed']
      });
    }

    const [result] = await db.query(
      `UPDATE campaigns SET status = ? WHERE id = ?`,
      [status, campaignId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    res.json({
      success: true,
      message: `Campaign status updated to ${status}`
    });
  } catch (err) {
    console.error("Admin update campaign status error:", err);
    res.status(500).json({ 
      error: "Failed to update campaign status",
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};

// Admin - Generate Campaign Report
exports.generateCampaignReport = async (req, res) => {
  const { campaignId } = req.params;

  try {
    const [campaign] = await db.query(
      `SELECT 
        c.*, 
        u.name as creator_name,
        (SELECT COUNT(*) FROM campaign_numbers WHERE campaign_id = c.id) as total_numbers,
        (SELECT COUNT(*) FROM campaign_numbers WHERE campaign_id = c.id AND status = 'success') as success_count,
        (SELECT COUNT(*) FROM campaign_numbers WHERE campaign_id = c.id AND status = 'failed') as failed_count
       FROM campaigns c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [campaignId]
    );

    if (!campaign.length) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const [numbers] = await db.query(
      `SELECT phone_number, status 
       FROM campaign_numbers 
       WHERE campaign_id = ?`,
      [campaignId]
    );

    // In a real implementation, you would generate a PDF/Excel file here
    // For this example, we'll return JSON with all the report data
    const report = {
      campaign: campaign[0],
      numbers,
      summary: {
        success_rate: (campaign[0].success_count / campaign[0].total_numbers * 100).toFixed(2) + '%',
        failed_rate: (campaign[0].failed_count / campaign[0].total_numbers * 100).toFixed(2) + '%'
      },
      generated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: report,
      message: "Report generated successfully"
    });
  } catch (err) {
    console.error("Admin generate report error:", err);
    res.status(500).json({ 
      error: "Failed to generate report",
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};


// Admin - Get Campaign Stats
exports.getCampaignStats = async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) AS total_campaigns,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_count,
        SUM(CASE WHEN status = 'on_process' THEN 1 ELSE 0 END) AS on_process_count
      FROM campaigns
    `);

    res.json({
      success: true,
      data: {
        total: stats[0].total_campaigns || 0,
        success: stats[0].success_count || 0,
        failed: stats[0].failed_count || 0,
        on_process: stats[0].on_process_count || 0
      }
    });
  } catch (err) {
    console.error("Get campaign stats error:", err);
    res.status(500).json({
      error: "Failed to fetch campaign stats"
    });
  }
};

// Get User Campaign Stats
exports.getUserCampaignStats = async (req, res) => {
  const user_id = req.user.id;

  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) AS total_campaigns,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_count,
        SUM(CASE WHEN status = 'on_process' THEN 1 ELSE 0 END) AS on_process_count
      FROM campaigns
      WHERE user_id = ?
    `, [user_id]);

    res.json({
      success: true,
      data: {
        total: stats[0].total_campaigns || 0,
        success: stats[0].success_count || 0,
        failed: stats[0].failed_count || 0,
        on_process: stats[0].on_process_count || 0
      }
    });
  } catch (err) {
    console.error("Get user campaign stats error:", err);
    res.status(500).json({
      error: "Failed to fetch campaign stats"
    });
  }
};


// Delete Campaign
exports.deleteCampaign = async (req, res) => {
  const { campaignId } = req.params;
  const user_id = req.user.id;

  try {
    // Verify campaign ownership
    const [campaign] = await db.query(
      `SELECT id FROM campaigns WHERE id = ? AND user_id = ?`,
      [campaignId, user_id]
    );

    if (!campaign.length) {
      return res.status(404).json({
        error: "Campaign not found or access denied",
      });
    }

    // Delete campaign numbers first (due to foreign key constraint)
    await db.query(
      `DELETE FROM campaign_numbers WHERE campaign_id = ?`,
      [campaignId]
    );

    // Delete campaign
    const [result] = await db.query(
      `DELETE FROM campaigns WHERE id = ?`,
      [campaignId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    res.json({
      success: true,
      message: "Campaign deleted successfully"
    });
  } catch (err) {
    console.error("Delete campaign error:", err);
    res.status(500).json({
      error: "Failed to delete campaign",
      details: process.env.NODE_ENV === "development" ? err.message : null,
    });
  }
};


// Get User Campaign Monthly Stats
exports.getUserCampaignMonthlyStats = async (req, res) => {
  const user_id = req.user.id;

  try {
    const [rows] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%b') AS month,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed
      FROM campaigns
      WHERE user_id = ?
      GROUP BY MONTH(created_at), DATE_FORMAT(created_at, '%b')
      ORDER BY MONTH(created_at)
    `, [user_id]);

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    console.error("Get user campaign monthly stats error:", err);
    res.status(500).json({
      error: "Failed to fetch monthly campaign stats"
    });
  }
};


// Admin - Get Campaign Monthly Stats
exports.getAdminCampaignMonthlyStats = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%b') AS month,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed
      FROM campaigns
      GROUP BY MONTH(created_at), DATE_FORMAT(created_at, '%b')
      ORDER BY MONTH(created_at)
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    console.error("Get admin campaign monthly stats error:", err);
    res.status(500).json({
      error: "Failed to fetch monthly campaign stats"
    });
  }
};


// Helper function untuk mendapatkan harga
async function getCampaignPrice(campaignType, totalNumbers) {
  const [pricing] = await db.query(
    `SELECT price_per_number 
     FROM campaign_pricing 
     WHERE campaign_type = ? 
       AND (min_numbers <= ? OR min_numbers IS NULL)
       AND (? <= max_numbers OR max_numbers IS NULL)
       AND status = 'active'
     ORDER BY min_numbers DESC
     LIMIT 1`,
    [campaignType, totalNumbers, totalNumbers]
  );
  
  return pricing.length > 0 ? parseFloat(pricing[0].price_per_number) : 0.0010;
}


// Admin - Approve Campaign dan potong saldo
exports.approveCampaign = async (req, res) => {
  const { campaignId } = req.params;
  const { action } = req.body; // 'approve' or 'reject'

  try {
    const [campaign] = await db.query(
      `SELECT c.*, u.balance as user_balance 
       FROM campaigns c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.id = ? AND c.status = 'on_process'`,
      [campaignId]
    );

    if (!campaign.length) {
      return res.status(404).json({ error: "Campaign not found or not ready for approval" });
    }

    const campaignData = campaign[0];

    if (action === 'approve') {
      // Cek saldo user
      if (parseFloat(campaignData.user_balance) < parseFloat(campaignData.total_cost)) {
        return res.status(400).json({
          error: "User has insufficient balance",
          required: campaignData.total_cost,
          current_balance: campaignData.user_balance
        });
      }

      // Potong saldo user
      await db.query(
        `UPDATE users 
         SET balance = balance - ? 
         WHERE id = ?`,
        [campaignData.total_cost, campaignData.user_id]
      );

      // Update status campaign
      await db.query(
        `UPDATE campaigns SET status = 'approved' WHERE id = ?`,
        [campaignId]
      );

      res.json({
        success: true,
        message: "Campaign approved and balance deducted",
        amount_deducted: campaignData.total_cost
      });

    } else if (action === 'reject') {
      // Update status campaign menjadi rejected
      await db.query(
        `UPDATE campaigns SET status = 'rejected' WHERE id = ?`,
        [campaignId]
      );

      res.json({
        success: true,
        message: "Campaign rejected"
      });
    }

  } catch (err) {
    console.error("Approve campaign error:", err);
    res.status(500).json({ error: "Failed to process campaign approval" });
  }
};


// Admin - Get all pricing
exports.getCampaignPricing = async (req, res) => {
  try {
    const [pricing] = await db.query(
      `SELECT * FROM campaign_pricing ORDER BY campaign_type, min_numbers`
    );
    
    res.json({ 
      success: true, 
      data: pricing 
    });
  } catch (err) {
    console.error("Get pricing error:", err);
    res.status(500).json({ 
      error: "Failed to get pricing",
      details: process.env.NODE_ENV === "development" ? err.message : null
    });
  }
};

// Admin - Update pricing
exports.updateCampaignPricing = async (req, res) => {
  const { id } = req.params;
  const { price_per_number, min_numbers, max_numbers, status } = req.body;

  try {
    await db.query(
      `UPDATE campaign_pricing 
       SET price_per_number = ?, min_numbers = ?, max_numbers = ?, status = ?
       WHERE id = ?`,
      [price_per_number, min_numbers, max_numbers, status, id]
    );
    
    res.json({ success: true, message: "Pricing updated successfully" });
  } catch (err) {
    console.error("Update pricing error:", err);
    res.status(500).json({ error: "Failed to update pricing" });
  }
};


// Admin - Create new pricing tier
exports.createCampaignPricing = async (req, res) => {
  const { campaign_type, price_per_number, min_numbers, max_numbers, status } = req.body;

  try {
    // Validasi input
    if (!campaign_type || !price_per_number || min_numbers === undefined) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["campaign_type", "price_per_number", "min_numbers"]
      });
    }

    if (!["whatsapp", "sms"].includes(campaign_type)) {
      return res.status(400).json({
        error: "Invalid campaign type",
        allowed: ["whatsapp", "sms"]
      });
    }

    // Cek overlap pricing
    const [overlap] = await db.query(
      `SELECT * FROM campaign_pricing 
       WHERE campaign_type = ? 
       AND (
         (min_numbers <= ? AND (max_numbers >= ? OR max_numbers IS NULL)) OR
         (min_numbers <= ? AND (max_numbers >= ? OR max_numbers IS NULL)) OR
         (? <= min_numbers AND (? >= max_numbers OR max_numbers IS NULL))
       )
       AND status = 'active'`,
      [campaign_type, min_numbers, min_numbers, max_numbers, max_numbers, min_numbers, max_numbers]
    );

    if (overlap.length > 0) {
      return res.status(400).json({
        error: "Pricing tier overlaps with existing active tier",
        overlapping_tiers: overlap
      });
    }

    const [result] = await db.query(
      `INSERT INTO campaign_pricing 
       (campaign_type, price_per_number, min_numbers, max_numbers, status)
       VALUES (?, ?, ?, ?, ?)`,
      [campaign_type, price_per_number, min_numbers, max_numbers || null, status || 'active']
    );

    res.status(201).json({
      success: true,
      message: "Pricing tier created successfully",
      data: {
        id: result.insertId,
        campaign_type,
        price_per_number,
        min_numbers,
        max_numbers,
        status: status || 'active'
      }
    });
  } catch (err) {
    console.error("Create pricing error:", err);
    res.status(500).json({
      error: "Failed to create pricing tier",
      details: process.env.NODE_ENV === "development" ? err.message : null
    });
  }
};

// Admin - Update pricing tier
exports.updateCampaignPricing = async (req, res) => {
  const { id } = req.params;
  const { price_per_number, min_numbers, max_numbers, status } = req.body;

  try {
    // Get current pricing data
    const [current] = await db.query(
      `SELECT * FROM campaign_pricing WHERE id = ?`,
      [id]
    );

    if (!current.length) {
      return res.status(404).json({
        error: "Pricing tier not found"
      });
    }

    const currentData = current[0];

    // Cek overlap dengan tier lain (kecuali diri sendiri)
    const [overlap] = await db.query(
      `SELECT * FROM campaign_pricing 
       WHERE campaign_type = ? 
       AND id != ?
       AND (
         (min_numbers <= ? AND (max_numbers >= ? OR max_numbers IS NULL)) OR
         (min_numbers <= ? AND (max_numbers >= ? OR max_numbers IS NULL)) OR
         (? <= min_numbers AND (? >= max_numbers OR max_numbers IS NULL))
       )
       AND status = 'active'`,
      [
        currentData.campaign_type, 
        id,
        min_numbers !== undefined ? min_numbers : currentData.min_numbers,
        min_numbers !== undefined ? min_numbers : currentData.min_numbers,
        max_numbers !== undefined ? max_numbers : currentData.max_numbers,
        max_numbers !== undefined ? max_numbers : currentData.max_numbers,
        min_numbers !== undefined ? min_numbers : currentData.min_numbers,
        max_numbers !== undefined ? max_numbers : currentData.max_numbers
      ]
    );

    if (overlap.length > 0) {
      return res.status(400).json({
        error: "Pricing tier overlaps with existing active tier",
        overlapping_tiers: overlap
      });
    }

    const [result] = await db.query(
      `UPDATE campaign_pricing 
       SET price_per_number = ?, 
           min_numbers = ?, 
           max_numbers = ?, 
           status = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        price_per_number !== undefined ? price_per_number : currentData.price_per_number,
        min_numbers !== undefined ? min_numbers : currentData.min_numbers,
        max_numbers !== undefined ? max_numbers : currentData.max_numbers,
        status !== undefined ? status : currentData.status,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Pricing tier not found"
      });
    }

    res.json({
      success: true,
      message: "Pricing tier updated successfully"
    });
  } catch (err) {
    console.error("Update pricing error:", err);
    res.status(500).json({
      error: "Failed to update pricing tier",
      details: process.env.NODE_ENV === "development" ? err.message : null
    });
  }
};

// Admin - Delete pricing tier
exports.deleteCampaignPricing = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      `DELETE FROM campaign_pricing WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Pricing tier not found"
      });
    }

    res.json({
      success: true,
      message: "Pricing tier deleted successfully"
    });
  } catch (err) {
    console.error("Delete pricing error:", err);
    res.status(500).json({
      error: "Failed to delete pricing tier",
      details: process.env.NODE_ENV === "development" ? err.message : null
    });
  }
};

// Get pricing untuk public (user bisa lihat harga)
exports.getPublicPricing = async (req, res) => {
  try {
    const [pricing] = await db.query(
      `SELECT campaign_type, price_per_number, min_numbers, max_numbers
       FROM campaign_pricing 
       WHERE status = 'active'
       ORDER BY campaign_type, min_numbers`
    );
    
    res.json({ 
      success: true, 
      data: pricing 
    });
  } catch (err) {
    console.error("Get public pricing error:", err);
    res.status(500).json({ 
      error: "Failed to get pricing information"
    });
  }
};


// Estimasi biaya campaign
exports.estimateCampaignCost = async (req, res) => {
  const { campaign_type, total_numbers } = req.body;

  try {
    const pricePerNumber = await getCampaignPrice(campaign_type, total_numbers);
    const totalCost = pricePerNumber * total_numbers;

    res.json({
      success: true,
      data: {
        total_numbers: total_numbers,
        price_per_number: pricePerNumber,
        total_cost: totalCost,
        campaign_type: campaign_type
      }
    });
  } catch (err) {
    console.error("Estimate cost error:", err);
    res.status(500).json({ error: "Failed to estimate cost" });
  }
};