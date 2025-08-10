const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { getProfile, updateProfile, changePassword } = require('../controllers/user.controller');

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.put('/change-password', auth, changePassword);

module.exports = router;
