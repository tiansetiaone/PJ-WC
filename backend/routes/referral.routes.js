const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { validateReferralRole } = require('../middlewares/validateReferral');
const { 
  getReferralData, 
  convertCommission,
  getAllReferrals, getBalance,   createReferralRole,
  getReferralRoles
} = require('../controllers/referral.controller');

// User endpoints
router.get('/', auth, getReferralData);
router.post('/convert', auth, convertCommission);
router.get('/balance', auth, getBalance);

// Admin endpoint
router.get('/all', auth, getAllReferrals);
router.get('/admin/all', auth, getAllReferrals);
router.get('/admin/roles', auth, getReferralRoles);
router.post('/admin/roles', auth, createReferralRole);

router.post('/admin/roles', 
  auth, 
  validateReferralRole, 
  createReferralRole
);

module.exports = router;