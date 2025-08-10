const db = require("../config/db");
const fs = require("fs");
const path = require("path");
const { validatePhoneNumbers } = require("../utils/validation");

// Constants
const MAX_TEXT_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TEXT_TYPES = ['text/plain'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

exports.createCampaign = async (req, res) => {
  const { campaign_name, campaign_date, message, campaign_type, image_url } = req.body;
  const user_id = req.user.id;

  try {
    // Validate required fields
    if (!campaign_name || !campaign_date || !message || !campaign_type) {
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["campaign_name", "campaign_date", "message", "campaign_type"]
      });
    }

    // Validate campaign type
    if (!['whatsapp', 'sms'].includes(campaign_type)) {
      return res.status(400).json({ 
        error: "Invalid campaign type",
        allowed: ["whatsapp", "sms"]
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
      campaign_id: result.insertId
    });

  } catch (err) {
    console.error("Create campaign error:", err);
    res.status(500).json({ 
      error: "Failed to create campaign",
      details: process.env.NODE_ENV === 'development' ? err.message : null
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
      data: rows
    });
  } catch (err) {
    console.error("Get campaigns error:", err);
    res.status(500).json({ 
      error: "Failed to fetch campaigns",
      details: process.env.NODE_ENV === 'development' ? err.message : null
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
        error: "Campaign not found or access denied"
      });
    }

    const campaignType = campaign[0].campaign_type;

    // 2. File validation
    if (!req.file) {
      return res.status(400).json({ error: "Please upload a TXT file" });
    }

    // 3. Process file
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const numbers = fileContent.split(/\r?\n/)
      .map(num => num.trim())
      .filter(num => num !== "");

    // 4. Validate phone numbers (logika validasi berbeda untuk SMS/WhatsApp)
    const { validNumbers, invalidNumbers } = validatePhoneNumbers(numbers, campaignType);

    if (invalidNumbers.length > 0) {
      return res.status(400).json({
        error: "Some phone numbers are invalid",
        invalidNumbers,
        validCount: validNumbers.length,
        invalidCount: invalidNumbers.length
      });
    }

    // 5. Save to database
    await db.query(
      `INSERT INTO campaign_numbers (campaign_id, phone_number) 
       VALUES ?`,
      [validNumbers.map(num => [campaignId, num])]
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
      campaignType: campaignType
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
    const [campaign] = await db.query(
      `SELECT id FROM campaigns WHERE id = ? AND user_id = ?`,
      [campaignId, user_id]
    );

    if (!campaign.length) {
      return res.status(404).json({ 
        error: "Campaign not found or access denied"
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
      data: numbers
    });

  } catch (err) {
    console.error("Get campaign numbers error:", err);
    res.status(500).json({ 
      error: "Failed to fetch campaign numbers",
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};