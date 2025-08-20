const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const profileController = require('../controllers/profile.controller');
const upload = require('../middlewares/upload.middleware');

// Enhanced form-data handler
const handleProfileUpload = (req, res, next) => {
  upload.single('profile_image')(req, res, (err) => {
    if (err) {
      let errorMessage = 'File upload failed';
      let errorCode = 'UPLOAD_ERROR';
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        errorMessage = 'File size exceeds 5MB limit';
        errorCode = 'FILE_TOO_LARGE';
      } else if (err.message.includes('Unexpected field')) {
        errorMessage = 'Invalid file field name';
        errorCode = 'INVALID_FILE_FIELD';
      }

      return res.status(400).json({
        success: false,
        error: errorMessage,
        code: errorCode
      });
    }
    
    // Parse text fields from form-data
    if (req.body) {
      req.body.name = req.body.name || null;
      req.body.username = req.body.username || null;
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


module.exports = router;