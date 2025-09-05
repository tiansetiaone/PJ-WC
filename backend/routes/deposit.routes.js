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
  setDefaultWallet
} = require("../controllers/deposit.controller");

// User endpoints
router.post("/generate-address", auth, generateDepositAddress);
router.post("/initiate", auth, initiateDeposit);
router.post("/submit-evidence", auth, uploadProof, submitDepositEvidence);
router.get("/status/:deposit_id", auth, checkDepositStatus);
router.get("/history", auth, getUserDeposits);
router.get("/credit/total", auth, getTotalCredit);

// Admin endpoints
router.get("/admin/requests", auth, auth.adminOnly, getDepositRequests);
router.get("/admin/details/:deposit_id", auth, auth.adminOnly, getDepositDetails);
router.post("/admin/process", auth, auth.adminOnly, processDeposit);
router.get("/admin/report", auth, auth.adminOnly, generateDepositReport);

// Admin: Campaign Stats
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


// Admin wallet management routes
router.get("/admin/wallets", auth, auth.adminOnly, getAdminWallets);
router.post("/admin/wallets", auth, auth.adminOnly, addAdminWallet);
router.delete("/admin/wallets/:id", auth, auth.adminOnly, deleteAdminWallet);
// Set default wallet route
router.post("/admin/wallets/set-default", auth, auth.adminOnly, setDefaultWallet);

module.exports = router;
