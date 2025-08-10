const express = require('express');
const router = express.Router();
const { registerUser, loginUser, forgotPassword, resetPassword, googleAuth, getResetToken } = require('../controllers/auth.controller');


// Hanya aktif di development
if (process.env.NODE_ENV === 'development') {
    router.get('/get-reset-token', getResetToken);
}

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/google', googleAuth);

module.exports = router;
