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
  updateCampaignStatus
} = require("../controllers/campaign.controller");

// 1. Setup Upload Directory
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Enhanced Multer Configuration
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
    const validMimeTypes = ['text/plain', 'application/octet-stream'];
    const validExtensions = ['.txt'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (
      validMimeTypes.includes(file.mimetype) || 
      validExtensions.includes(fileExt)
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only .txt files are allowed'), false);
    }
  },
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB
    files: 1
  }
}).single('numbersFile'); // Field name harus sesuai

// 3. Custom Upload Middleware with Debugging
const textUploadMiddleware = (req, res, next) => {
  console.log('Upload middleware triggered');
  console.log('Headers:', req.headers);
  
  handleTextUpload(req, res, (err) => {
    if (err) {
      console.error('Upload Error:', err);
      
      // Enhanced error messages
      let errorMsg = 'File upload failed';
      if (err.code === 'LIMIT_FILE_SIZE') errorMsg = 'File size exceeds 1MB limit';
      if (err.message.includes('.txt')) errorMsg = err.message;
      
      return res.status(400).json({ 
        success: false,
        error: errorMsg,
        details: process.env.NODE_ENV === 'development' ? {
          error: err.message,
          code: err.code,
          receivedFile: req.file,
          body: req.body
        } : undefined
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ 
        error: "No file uploaded or file processing failed",
        debug: process.env.NODE_ENV === 'development' ? {
          headers: req.headers,
          files: req.files
        } : undefined
      });
    }
    
    console.log('File successfully uploaded:', req.file);
    next();
  });
};

// 4. Routes
router.post("/", auth, createCampaign);
router.get("/", auth, getUserCampaigns);

router.post(
  "/:campaignId/numbers",
  auth,
  textUploadMiddleware, // Middleware upload yang diperbaiki
  uploadCampaignNumbers
);

router.get("/:campaignId/numbers", auth, getCampaignNumbers);
router.get("/:campaignId/status", auth, getCampaignStatus);

// Admin routes
router.get(
  "/admin/campaigns",
  auth,
  auth.adminOnly,
  getAllCampaigns
);

router.get(
  "/admin/campaigns/:campaignId",
  auth,
  auth.adminOnly,
  getCampaignDetails
);

router.put(
  "/admin/campaigns/:campaignId/status",
  auth,
  auth.adminOnly,
  updateCampaignStatus
);

router.get(
  "/admin/campaigns/:campaignId/report",
  auth,
  auth.adminOnly,
  generateCampaignReport
);

module.exports = router;