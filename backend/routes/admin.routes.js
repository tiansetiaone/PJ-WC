const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const adminController = require('../controllers/admin.controller');

// Admin middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Forbidden',
      code: 'ADMIN_ACCESS_REQUIRED'
    });
  }
  next();
};

// Campaign Management Routes
router.get('/campaigns', auth, adminOnly, adminController.getAllCampaigns);
router.get('/campaigns/:id', auth, adminOnly, adminController.getCampaignDetails);
router.put('/campaigns/:id/status', auth, adminOnly, adminController.updateCampaignStatus);

// Enhanced Deposit Management
router.get('/deposits', auth, adminOnly, adminController.getAllDeposits);
router.post('/deposits/:id/approve', auth, adminOnly, adminController.approveDeposit);
router.post('/deposits/:id/reject', auth, adminOnly, adminController.rejectDeposit);

// User Management
router.get('/users', auth, adminOnly, adminController.getAllUsers);
router.put('/users/:id', auth, adminOnly, adminController.updateUserProfile);

// Referral System
router.get('/referrals', auth, adminOnly, adminController.getAllReferrals);

// Support System
router.get('/support-tickets', auth, adminOnly, adminController.getAllSupportTickets);
router.post('/support-tickets/:id/respond', auth, adminOnly, adminController.respondSupportTicket);
// Add to admin.routes.js
router.post('/campaigns', auth, adminOnly, adminController.adminCreateCampaign);
module.exports = router;