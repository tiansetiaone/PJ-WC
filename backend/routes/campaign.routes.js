const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { 
  createCampaign, 
  getUserCampaigns, 
  uploadCampaignNumbers,
  getCampaignNumbers,
  getCampaignStatus,
  generateCampaignReport,
  getAllCampaigns,
  getCampaignDetails,
  updateCampaignStatus,
  getCampaignStats,
  getUserCampaignStats,
  deleteCampaign,
  getAdminCampaignMonthlyStats,
  getUserCampaignMonthlyStats,
  uploadCampaignNumbersRaw
} = require("../controllers/campaign.controller");

// 1. Setup Upload Directory
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Multer untuk upload gambar campaign
const uploadImage = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `image-${Date.now()}${path.extname(file.originalname)}`);
    }
  }),
}).single("image");

// 3. Multer khusus TXT
const handleTextUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `numbers-${Date.now()}-${file.originalname}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const validMimeTypes = ["text/plain", "application/octet-stream"];
    const validExtensions = [".txt"];
    const fileExt = path.extname(file.originalname).toLowerCase();

    if (validMimeTypes.includes(file.mimetype) || validExtensions.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error("Only .txt files are allowed"), false);
    }
  },
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB
    files: 1
  }
}).single("numbersFile");

// Middleware wrapper biar error lebih jelas
const textUploadMiddleware = (req, res, next) => {
  handleTextUpload(req, res, (err) => {
    if (err) {
      let errorMsg = "File upload failed";
      if (err.code === "LIMIT_FILE_SIZE") errorMsg = "File size exceeds 1MB limit";
      if (err.message.includes(".txt")) errorMsg = err.message;

      return res.status(400).json({
        success: false,
        error: errorMsg,
        details: process.env.NODE_ENV === "development" ? {
          message: err.message,
          code: err.code,
        } : undefined
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded"
      });
    }

    next();
  });
};

// ================= ROUTES ================== //

// Create campaign (with optional image)
router.post("/", auth, uploadImage, createCampaign);

// Upload numbers TXT file
router.post("/:campaignId/numbers", auth, textUploadMiddleware, uploadCampaignNumbers);

// Upload numbers raw (paste langsung di body)
router.post(
  "/:campaignId/numbers-raw",
  auth,
  express.text({ type: "text/plain" }),
  uploadCampaignNumbersRaw
);

// Get campaign numbers
router.get("/:campaignId/numbers", auth, getCampaignNumbers);

// Get campaign status
router.get("/:campaignId/status", auth, getCampaignStatus);

// User campaigns
router.get("/", auth, getUserCampaigns);

// Admin routes
router.get("/admin/campaigns", auth, auth.adminOnly, getAllCampaigns);
router.get("/admin/campaigns/:campaignId", auth, auth.adminOnly, getCampaignDetails);
router.put("/admin/campaigns/:campaignId/status", auth, auth.adminOnly, updateCampaignStatus);
router.get("/admin/campaigns/:campaignId/report", auth, auth.adminOnly, generateCampaignReport);
router.get("/admin/stats", auth, auth.adminOnly, getCampaignStats);
router.get("/admin/stats/monthly", auth, auth.adminOnly, getAdminCampaignMonthlyStats);

// User stats
router.get("/stats", auth, getUserCampaignStats);
router.get("/stats/monthly", auth, getUserCampaignMonthlyStats);

// Delete campaign
router.delete("/:campaignId", auth, deleteCampaign);

router.get("/:campaignId", auth, getCampaignDetails);

module.exports = router;
