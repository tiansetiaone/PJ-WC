const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const {
    generateDepositAddress,
    submitDepositEvidence,
    getUserDeposits,
    getDepositRequests,
    processDeposit
} = require('../controllers/deposit.controller');

// User routes
router.post('/generate-address', auth, generateDepositAddress);
router.post('/submit-evidence', auth, submitDepositEvidence);
router.get('/', auth, getUserDeposits);

// Admin routes
router.get('/admin/requests', auth, auth.adminOnly, getDepositRequests);
router.post('/admin/process', auth, auth.adminOnly, processDeposit);

module.exports = router;