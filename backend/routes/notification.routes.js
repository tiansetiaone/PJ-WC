const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const notificationController = require('../controllers/notification.controller');

router.get('/', authMiddleware, notificationController.getNotifications);
router.post('/', authMiddleware, authMiddleware.adminOnly, notificationController.createNotification);

module.exports = router;