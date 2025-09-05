const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const profileController = require('../controllers/profile.controller');
const upload = require('../middlewares/upload.middleware');

// profile.route.js - Alternatif solusi sederhana
const handleProfileUpload = (req, res, next) => {
  // Process the file upload first
  upload.single('profile_image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File size exceeds 5MB limit',
          code: 'FILE_TOO_LARGE'
        });
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        // No file uploaded, continue
        return next();
      } else {
        return res.status(400).json({
          success: false,
          error: 'File upload failed',
          code: 'UPLOAD_ERROR'
        });
      }
    }
    
    // Manually parse form fields from multipart form data
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      // Fields are already parsed by multer and available in req.body
      console.log('Parsed form fields:', req.body);
    }
    
    next();
  });
};

router.get('/', auth, profileController.getProfile);
router.get('/summary', auth, profileController.getProfileSummary);
router.get('/:id', auth, auth.adminOnly, profileController.getProfile);

router.put('/', auth, handleProfileUpload, profileController.updateProfile);
router.put('/:id', auth, auth.adminOnly, handleProfileUpload, profileController.updateProfile);

router.delete('/', auth, profileController.deactivateAccount);
router.delete('/:id', auth, auth.adminOnly, profileController.deactivateAccount);

router.get('/stats/users', auth, auth.adminOnly, profileController.getUserStats);


// profile.route.js - Tambahkan route untuk change password
// Tambahkan route untuk perubahan password
router.post('/change-password', auth, profileController.changePassword);


module.exports = router;