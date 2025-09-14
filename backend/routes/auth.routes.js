const express = require("express");
const router = express.Router();
const { registerUser, loginUser, forgotPassword, resetPassword, googleAuth, getResetToken, verifyUser, checkAccountStatus, getVerifyUserPage, getUserById, getProfileWithConversionRules, getAllUsers, deleteUser,adminResetPassword, getUserBalance, updateUserCredit
} = require("../controllers/auth.controller");
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

router.get('/conversion-rules', authMiddleware, getProfileWithConversionRules);

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

// Di auth.routes.js
router.get("/admin/users/:id", authMiddleware, authMiddleware.adminOnly, getUserById);

router.get("/users/:id", authMiddleware, getUserById);

router.get('/account-status', checkAccountStatus);

// ambil semua users
router.get(
  "/admin/users",
  authMiddleware,
  authMiddleware.adminOnly,
  getAllUsers
);

router.delete("/admin/users/:id",
  authMiddleware,
  authMiddleware.adminOnly,
  deleteUser
);


router.post(
  "/admin/reset-password",
  authMiddleware,
  authMiddleware.adminOnly,
  adminResetPassword
);

router.get('/balance', authMiddleware, getUserBalance);

router.post(
  "/admin/update-credit",
  authMiddleware,
  authMiddleware.adminOnly,
  updateUserCredit
);

module.exports = router;
