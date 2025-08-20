const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { 
  trackVisit,
  getReferralData, 
  convertCommission,
  getAllReferrals, 
  getBalance,
  getCommissionStats,
  createReferralRole,
  updateReferralRole,
  deleteReferralRole,
  getReferralRole,
  setDefaultRole,
  checkCommissions,
  getGlobalReferralStats
} = require('../controllers/referral.controller');

// Public endpoint
router.get('/track/:referrer_code', trackVisit);

// User endpoints
router.get('/', auth, getReferralData);
router.post('/convert', auth, convertCommission);
router.get('/balance', auth, getBalance);


// Admin endpoints
router.get('/all', auth, getAllReferrals);
router.get('/stats', auth, getCommissionStats);
router.post('/admin/roles', auth, createReferralRole);
router.get('/admin/roles/:id', auth, getReferralRole);
router.put('/admin/roles/:id', auth, updateReferralRole);
router.delete('/admin/roles/:id', auth, deleteReferralRole);
router.post('/admin/roles/:id/set-default', auth, setDefaultRole);
router.get('/admin/roles', auth, getReferralRole);
router.post('/admin/check-commissions/:id', auth, checkCommissions);
router.get('/admin/global-stats', auth, getGlobalReferralStats);


module.exports = router;