const db = require('../config/db');
const { notifyNewTicket, sendTicketResponse, sendVerificationRequestEmail } = require('../services/emailService');
const { sendTelegramMessage } = require('../services/telegramService');

// User: Create support ticket
// User: Create support ticket (updated version)
exports.createTicket = async (req, res) => {
  const { subject, message, requestType = 'general', email, name } = req.body;
  const userId = req.user?.id;
  
  try {
    // Validation for unauthenticated users
    if (!userId && (!email || !name)) {
      return res.status(400).json({ 
        error: 'For unauthenticated requests, name and email are required',
        code: 'UNAUTHENTICATED_REQUIREMENTS',
        fields: { email: !email, name: !name }
      });
    }

    // General validation
    if (!subject || !message) {
      return res.status(400).json({ 
        error: 'Subject and message are required',
        code: 'MISSING_FIELDS',
        fields: { subject: !subject, message: !message }
      });
    }

    // Save ticket with user_name for unauthenticated users
    const [result] = await db.query(
      `INSERT INTO support_tickets 
       (user_id, user_name, email, subject, message, status, request_type) 
       VALUES (?, ?, ?, ?, ?, 'open', ?)`,
      [
        userId || null,
        userId ? null : name, // Store name only for unauthenticated users
        userId ? req.user?.email : email,
        subject,
        message,
        requestType
      ]
    );

    // Determine user name for notification
    const userName = userId ? req.user?.name : name;

    // Notify based on request type
    if (requestType === 'verification') {
      await sendVerificationRequestEmail(
        userId ? req.user.email : email,
        result.insertId,
        subject,
        message
      );
    } else {
      await notifyNewTicket(
        result.insertId,
        subject,
        message,
        userName || 'Unknown User'
      );
    }

    res.json({ 
      success: true,
      ticketId: result.insertId,
      message: 'Support ticket created successfully',
      isAuthenticated: !!userId
    });

  } catch (err) {
    console.error('Ticket creation error:', err);
    res.status(500).json({ 
      error: 'Failed to create ticket',
      code: 'TICKET_CREATION_FAILED',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};


// New endpoint for verification requests (no auth required)
exports.requestVerification = async (req, res) => {
  const { email, message } = req.body;
  
  try {
    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: 'Please provide a valid email address',
        code: 'INVALID_EMAIL'
      });
    }

    // Check if user exists and is inactive
    const [user] = await db.query(
      'SELECT id, name, is_active FROM users WHERE email = ?',
      [email]
    );

    if (!user.length) {
      return res.status(404).json({
        error: 'No account found with this email. Please register first.',
        code: 'ACCOUNT_NOT_FOUND'
      });
    }

    if (user[0].is_active === 1) {
      return res.status(400).json({
        error: 'This account is already active',
        code: 'ACCOUNT_ACTIVE'
      });
    }

    // Create ticket
    const [result] = await db.query(
      `INSERT INTO support_tickets 
       (user_id, email, subject, message, status, request_type) 
       VALUES (?, ?, ?, ?, 'open', 'verification')`,
      [
        user[0].id, 
        email, 
        'Account Verification Request', 
        message || `${user[0].name} requests account verification`,
        'verification'
      ]
    );

    // Send notification
    await sendVerificationRequestEmail(
      email,
      result.insertId,
      'Account Verification Request',
      message || `${user[0].name} (${email}) requests account verification`
    );

    res.json({
      success: true,
      ticketId: result.insertId,
      message: 'Your verification request has been submitted. Our team will review it shortly.'
    });

  } catch (err) {
    console.error('Verification request failed:', {
      error: err.message,
      email,
      timestamp: new Date().toISOString()
    });

    const errorResponse = {
      error: 'Could not process your verification request',
      code: 'VERIFICATION_REQUEST_FAILED'
    };

    // Only include details in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = err.message;
      errorResponse.stack = err.stack;
    }

    res.status(500).json(errorResponse);
  }
};


// Admin: Get all tickets
exports.getAllTickets = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required',
      code: 'ADMIN_ONLY' 
    });
  }

  try {
    const [tickets] = await db.query(`
      SELECT 
        t.id, 
        t.subject, 
        t.status,
        t.created_at,
        u.name as user_name,
        u.email as user_email
      FROM support_tickets t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch tickets',
      code: 'FETCH_TICKETS_FAILED' 
    });
  }
};

// Admin: Respond to ticket
exports.respondToTicket = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required',
      code: 'ADMIN_ONLY' 
    });
  }

  const { ticketId } = req.params;
  const { response, via, action = 'reply' } = req.body;

  try {
    // Handle call action
    if (action === 'call') {
      await db.query(`
        UPDATE support_tickets 
        SET 
          response = 'Contacted via phone call',
          responded_at = NOW(),
          status = 'closed',
          contact_method = 'call'
        WHERE id = ?
      `, [ticketId]);

      return res.json({ 
        success: true,
        message: 'Ticket marked as contacted via call',
        contact_method: 'call'
      });
    }

    // Validate for reply action
    if (!response || !via) {
      return res.status(400).json({
        error: 'Response content and via method are required for replies',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // 1. Update ticket for reply action
    await db.query(`
      UPDATE support_tickets 
      SET 
        response = ?,
        responded_at = NOW(),
        status = 'closed',
        contact_method = ?
      WHERE id = ?
    `, [response, via, ticketId]);

    // 2. Get ticket details
    const [[ticket]] = await db.query(`
      SELECT 
        t.message,
        u.name,
        u.email,
        u.whatsapp_number
      FROM support_tickets t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `, [ticketId]);

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found',
        code: 'TICKET_NOT_FOUND'
      });
    }

    // 3. Send response via selected channel
    let responseResult;
    if (via === 'email') {
      responseResult = await sendTicketResponse(
        ticket.email,
        ticketId,
        response
      );
    } else if (via === 'telegram') {
      responseResult = await sendTelegramResponse(
        ticket.whatsapp_number, 
        `*Blasterc Support*\nTicket #${ticketId}\n\n${response}`
      );
      
      if (!responseResult.success) {
        console.error('Failed to send via Telegram, falling back to email');
        await sendTicketResponse(ticket.email, ticketId, response);
        via = 'email'; // Update method since we fell back
      }
    } else {
      return res.status(400).json({
        error: 'Invalid response method',
        code: 'INVALID_RESPONSE_METHOD',
        valid_methods: ['email', 'telegram']
      });
    }

    res.json({ 
      success: true,
      message: `Response sent via ${via}`,
      ticketId,
      contact_method: via,
      response_status: 'closed'
    });

  } catch (err) {
    console.error('Ticket response error:', {
      error: err.message,
      ticketId,
      action,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({ 
      error: 'Failed to respond to ticket',
      code: 'RESPONSE_FAILED',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Helper functions
async function notifyAdminAboutNewTicket(ticketId, subject) {
  const adminEmail = 'admin@blasterc.id';
  const message = `New support ticket #${ticketId}: ${subject}`;
  await sendEmail(adminEmail, 'New Support Ticket', message);
}

async function sendEmailResponse(email, response) {
  await sendEmail(
    email,
    'Your Support Ticket Response',
    `Our team has responded to your ticket:\n\n${response}`
  );
}

async function sendTelegramResponse(phone, response) {
  await sendTelegramMessage(
    phone,
    `*Blasterc Support Response*\n\n${response}`
  );
}


// Di support.controller.js
exports.getTicketDetails = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required',
      code: 'ADMIN_ONLY' 
    });
  }

  const { ticketId } = req.params;

  try {
    const [[ticket]] = await db.query(`
      SELECT 
        t.*,
        u.name as user_name,
        u.email as user_email,
        u.whatsapp_number
      FROM support_tickets t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `, [ticketId]);

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found',
        code: 'TICKET_NOT_FOUND'
      });
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch ticket details',
      code: 'FETCH_TICKET_FAILED' 
    });
  }
};