const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const notificationController = require("../controllers/notification.controller");

// Admin only routes
router.get("/admin", authMiddleware, authMiddleware.adminOnly, notificationController.getAllNotifications);
router.get("/admin/:id", authMiddleware, authMiddleware.adminOnly, notificationController.getNotificationById);
router.post("/admin", authMiddleware, authMiddleware.adminOnly, notificationController.createNotification);
router.put("/admin/:id", authMiddleware, authMiddleware.adminOnly, notificationController.updateNotification);
router.delete("/admin/:id", authMiddleware, authMiddleware.adminOnly, notificationController.deleteNotification);

// Shared routes (for users and admins)
router.get("/", authMiddleware, notificationController.getNotifications);

module.exports = router;