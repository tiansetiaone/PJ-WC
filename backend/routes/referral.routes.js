const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
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
  getGlobalReferralStats,
  getConvertedHistory,
  getAllReferralRoles,
  createCommissionSetting,
  getCommissionSettings,
  setActiveCommissionSetting,
  updateCommissionSetting,
  deleteCommissionSetting,
  getCommissionSettingById,
  processReferralCommission
} = require("../controllers/referral.controller");

// Public endpoint
router.get("/track/:referrer_code", trackVisit);

// User endpoints
router.get("/", auth, getReferralData);
router.post("/convert", auth, convertCommission);
router.get("/balance", auth, getBalance);
router.get("/converted-history", auth, getConvertedHistory);

// Admin endpoints
router.get("/all", auth, getAllReferrals);
router.get("/stats", auth, getCommissionStats);
router.post("/admin/roles", auth, createReferralRole);
router.get("/admin/roles/:id", auth, getReferralRole);
router.put("/admin/roles/:id", auth, updateReferralRole);
router.delete("/admin/roles/:id", auth, deleteReferralRole);
router.post("/admin/roles/:id/set-default", auth, setDefaultRole);
router.get("/admin/roles", auth, getAllReferralRoles);
router.post("/admin/check-commissions/:id", auth, checkCommissions);
router.get("/admin/global-stats", auth, getGlobalReferralStats);

// Commission Settings endpoints
router.post("/admin/settings", auth, createCommissionSetting);
router.get("/admin/settings", auth, getCommissionSettings);
router.get("/admin/settings/:id", auth, getCommissionSettingById); // Get single setting
router.put("/admin/settings/:id", auth, updateCommissionSetting); // Update setting
router.delete("/admin/settings/:id", auth, deleteCommissionSetting); // Delete setting
router.post("/admin/settings/:id/activate", auth, setActiveCommissionSetting);



// Di referral.routes.js
router.post('/admin/process-commissions/:userId', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  
  try {
    const { userId } = req.params;
    const { depositAmount } = req.body;
    
    const result = await processReferralCommission(userId, depositAmount);
    
    if (result) {
      res.json({
        success: true,
        message: `Commission processed: ${result.commissionAmount} awarded to user ${result.referrerId}`,
        data: result
      });
    } else {
      res.json({
        success: false,
        message: 'No commission processed (no referrer or conditions not met)'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Di referral.routes.js
router.post('/check-commissions', auth, async (req, res) => {
  try {
    const { checkAndUpdateCommissionStatus } = require('../controllers/referral.controller');
    await checkAndUpdateCommissionStatus(req.user.id);
    
    res.json({
      success: true,
      message: 'Commission status checked and updated successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;