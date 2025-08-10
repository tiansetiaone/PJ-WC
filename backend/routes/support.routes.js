const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { 
  createTicket,
  getAllTickets,
  respondToTicket 
} = require('../controllers/support.controller');

// User endpoints
router.post('/', auth, createTicket);

// Admin endpoints
router.get('/', auth, getAllTickets);
router.post('/:ticketId/respond', auth, respondToTicket);

module.exports = router;