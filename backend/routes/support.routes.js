const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Public routes
router.post('/request-verification', supportController.requestVerification);

// Authenticated routes
router.post('/tickets', authMiddleware, supportController.createTicket);
router.get('/tickets', authMiddleware, authMiddleware.adminOnly, supportController.getAllTickets);
router.post('/tickets/:ticketId/respond', authMiddleware, authMiddleware.adminOnly, supportController.respondToTicket);
// Di support.routes.js
router.post('/tickets/public', supportController.createTicket); // Tambahkan route baru untuk public access
// Di support.routes.js
router.get('/tickets/:ticketId', authMiddleware, authMiddleware.adminOnly, supportController.getTicketDetails);

// Public: get all contacts
router.get("/", authMiddleware, supportController.getContacts);

// Admin only
router.post("/",authMiddleware, authMiddleware.adminOnly, supportController.createContact);
router.put("/:id", authMiddleware, authMiddleware.adminOnly, supportController.updateContact);
router.delete("/:id", authMiddleware, authMiddleware.adminOnly, supportController.deleteContact);
router.patch("/:id/active", authMiddleware, authMiddleware.adminOnly, supportController.toggleContactActive);


module.exports = router;


