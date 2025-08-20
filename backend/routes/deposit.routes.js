const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const {
  generateDepositAddress,
  submitDepositEvidence,
  checkDepositStatus,
  getUserDeposits,
  getDepositRequests,
  processDeposit,
  initiateDeposit,
  getDepositDetails,
  generateDepositReport,
  getTotalCredit,
  getDepositStats
} = require('../controllers/deposit.controller');

// User endpoints
router.post('/generate-address', auth, generateDepositAddress);
router.post('/initiate', auth, initiateDeposit);
router.post('/submit-evidence', auth, submitDepositEvidence);
router.get('/status/:deposit_id', auth, checkDepositStatus);
router.get('/history', auth, getUserDeposits);
router.get('/credit/total', auth, getTotalCredit);

// Admin endpoints
router.get('/admin/requests', auth, auth.adminOnly, getDepositRequests);
router.get('/admin/details/:deposit_id', auth, auth.adminOnly, getDepositDetails);
router.post('/admin/process', auth, auth.adminOnly, processDeposit);
router.get('/admin/report', auth, auth.adminOnly, generateDepositReport);

// Admin: Campaign Stats
// Admin: Deposit Stats
router.get('/admin/deposit-stats', auth, auth.adminOnly, getDepositStats);



module.exports = router;