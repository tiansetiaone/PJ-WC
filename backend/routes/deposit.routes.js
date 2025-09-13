const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload");
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
  getDepositStats,
  getDepositAmounts,
  convertCommission,
  createDepositAmount,
  deleteDepositAmount,
  updateDepositAmount,
  uploadProof,
  getConvertedHistory,
  getUserUSDTInfo,
  updateUserUSDT,
  addAdminWallet,
  deleteAdminWallet,
  getAdminWallets,
  setDefaultWallet,
  cancelDeposit,
  deleteDeposit,
  checkWalletAvailability,
  addUSDTAddress,
  getUserUSDTAddresses,
  deleteUSDTAddress,
  setDefaultUSDTAddress,
  updateUSDTAddress,
  getUserTotalCredit,
  getCreditUsageHistory,
  getUserCreditByAdmin
} = require("../controllers/deposit.controller");

// User endpoints
router.post("/generate-address", auth, checkWalletAvailability, generateDepositAddress);
router.post("/initiate", auth, checkWalletAvailability, initiateDeposit);
router.post("/submit-evidence", auth, uploadProof, submitDepositEvidence);
router.get("/status/:deposit_id", auth, checkDepositStatus);
router.get("/history", auth, getUserDeposits);


// Admin endpoints
router.get("/admin/requests", auth, auth.adminOnly, getDepositRequests);
router.get("/admin/details/:deposit_id", auth, auth.adminOnly, getDepositDetails);
router.post("/admin/process", auth, auth.adminOnly, processDeposit);
router.get("/admin/report", auth, auth.adminOnly, generateDepositReport);

// Admin: Deposit Stats
router.get("/admin/deposit-stats", auth, auth.adminOnly, getDepositStats);
// User: get deposit amounts
router.get("/admin/amounts", auth, getDepositAmounts);

// CREATE
router.post("/admin/amounts", auth, createDepositAmount);

// UPDATE
router.put("/admin/amounts/:id", auth, updateDepositAmount);

// DELETE
router.delete("/admin/amounts/:id", auth, deleteDepositAmount);

router.get("/admin/commission/history", auth, auth.adminOnly, getConvertedHistory);

// Endpoint convert commission (user)
router.post("/convert-commission", auth, convertCommission);

// User USDT info endpoint
router.get("/user/usdt-info", auth, getUserUSDTInfo);

// Update user USDT information
router.post("/update-usdt", auth, updateUserUSDT);

router.get('/user/usdt-addresses', auth, getUserUSDTAddresses);
router.post('/user/usdt-addresses', auth, addUSDTAddress);
router.put('/user/usdt-addresses/:id', auth, updateUSDTAddress);
router.delete('/user/usdt-addresses/:id', auth, deleteUSDTAddress);
router.put('/user/usdt-addresses/:id/set-default', auth, setDefaultUSDTAddress);


router.get("/admin/wallets/user", auth, getAdminWallets);

// Admin wallet management routes
router.get("/admin/wallets", auth, auth.adminOnly, getAdminWallets);
router.post("/admin/wallets", auth, auth.adminOnly, addAdminWallet);
router.delete("/admin/wallets/:id", auth, auth.adminOnly, deleteAdminWallet);
// Set default wallet route
router.post("/admin/wallets/set-default", auth, auth.adminOnly, setDefaultWallet);


// di deposit.routes.js
router.post('/cancel/:deposit_id', auth, cancelDeposit);


// DELETE /api/deposits/admin/delete/:id - Hapus deposit (admin only)
router.delete(
  "/admin/delete/:id",
  auth,
  auth.adminOnly,
  deleteDeposit
);

// User credit info
router.get("/user/credit", auth, getUserTotalCredit);

router.get("/user/credit/history", auth, getCreditUsageHistory);


// Admin get user credit
router.get("/admin/user-credit/:user_id", auth, auth.adminOnly, getUserCreditByAdmin);

module.exports = router;
