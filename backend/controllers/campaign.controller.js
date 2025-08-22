const db = require("../config/db");
const fs = require("fs");
const path = require("path");
const { validatePhoneNumbers } = require("../utils/validation");

// Constants
const MAX_TEXT_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TEXT_TYPES = ["text/plain"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg"];

exports.createCampaign = async (req, res) => {
  const { campaign_name, campaign_date, message, campaign_type, image_url } = req.body;
  const user_id = req.user.id;

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

    // Insert campaign (image_url can be null for WhatsApp)
    const [result] = await db.query(
      `INSERT INTO campaigns 
       (user_id, campaign_name, campaign_date, message, image_url, campaign_type, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, 'on_process', NOW())`,
      [user_id, campaign_name, campaign_date, message, image_url || null, campaign_type]
    );

    res.status(201).json({
      success: true,
      message: "Campaign created successfully",
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

exports.uploadCampaignNumbers = async (req, res) => {
  const { campaignId } = req.params;
  const user_id = req.user.id;

  try {
    // 1. Verify campaign ownership (untuk semua tipe)
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

    // 4. Validate phone numbers (logika validasi berbeda untuk SMS/WhatsApp)
    const { validNumbers, invalidNumbers } = validatePhoneNumbers(numbers, campaignType);

    if (invalidNumbers.length > 0) {
      return res.status(400).json({
        error: "Some phone numbers are invalid",
        invalidNumbers,
        validCount: validNumbers.length,
        invalidCount: invalidNumbers.length,
      });
    }

    // 5. Save to database
    await db.query(
      `INSERT INTO campaign_numbers (campaign_id, phone_number) 
       VALUES ?`,
      [validNumbers.map((num) => [campaignId, num])]
    );

    // 6. Update campaign status
    await db.query(
      `UPDATE campaigns SET status = 'on_process' 
       WHERE id = ?`,
      [campaignId]
    );

    // Cleanup
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Phone numbers uploaded successfully for ${campaignType} campaign`,
      totalUploaded: validNumbers.length,
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

  try {
    const [campaign] = await db.query(
      `SELECT 
        c.*, 
        u.name as creator_name,
        u.email as creator_email,
        (SELECT COUNT(*) FROM campaign_numbers WHERE campaign_id = c.id) as total_numbers,
        (SELECT COUNT(*) FROM campaign_numbers WHERE campaign_id = c.id AND status = 'success') as success_count
       FROM campaigns c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [campaignId]
    );

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
    console.error("Admin get campaign details error:", err);
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
