const express = require("express");
const router = express.Router();
const { registerUser, loginUser, forgotPassword, resetPassword, googleAuth, getResetToken, verifyUser, checkAccountStatus, getVerifyUserPage, getUserById} = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Hanya aktif di development
if (process.env.NODE_ENV === "development") {
  router.get("/get-reset-token", getResetToken);
}

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/google", googleAuth);

router.get(
  "/admin/verify-user/:id",
  authMiddleware,
  authMiddleware.adminOnly,
  getVerifyUserPage
);


// Add this to auth.routes.js
router.post(
  "/admin/verify-user",
  authMiddleware,
  authMiddleware.adminOnly,
  verifyUser
);

router.get('/admin/users/:id', getUserById);

router.get('/account-status', checkAccountStatus);

module.exports = router;
