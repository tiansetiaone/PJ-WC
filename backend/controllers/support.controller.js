const db = require('../config/db');
const { notifyNewTicket, sendTicketResponse } = require('../services/emailService');
const { sendTelegramMessage } = require('../services/telegramService');

// User: Create support ticket
exports.createTicket = async (req, res) => {
  const { subject, message } = req.body;
  
  try {
    // Validasi input
    if (!subject || !message) {
      return res.status(400).json({ 
        error: 'Subject and message are required',
        code: 'MISSING_FIELDS'
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        error: 'Message exceeds 2000 characters',
        code: 'MESSAGE_TOO_LONG'
      });
    }

    // Simpan ticket ke database
    const [result] = await db.query(
      `INSERT INTO support_tickets 
       (user_id, subject, message, status) 
       VALUES (?, ?, ?, 'open')`,
      [req.user.id, subject, message]
    );

    // Kirim notifikasi ke admin
    await notifyNewTicket(
  result.insertId, 
  subject, 
  message, 
  req.user.name
);

    res.json({ 
      success: true,
      ticketId: result.insertId,
      message: 'Support ticket submitted successfully'
    });

  } catch (err) {
    console.error('Ticket submission error:', err);
    res.status(500).json({ 
      error: 'Failed to submit ticket',
      code: 'TICKET_SUBMISSION_FAILED'
    });
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
  const { response, via } = req.body; // via: 'email' or 'telegram'

  try {
    // 1. Update ticket
    await db.query(`
      UPDATE support_tickets 
      SET 
        response = ?,
        responded_at = NOW(),
        status = 'closed'
      WHERE id = ?
    `, [response, ticketId]);

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

    // 3. Send response via selected channel
    if (via === 'email') {
  await sendTicketResponse(
    ticket.email,
    ticketId,
    response
  );
} else if (via === 'telegram') {
  const telegramResponse = await sendTelegramResponse(
    ticket.whatsapp_number, 
    `*Blasterc Support*\nTicket #${ticketId}\n\n${response}`
  );
  
  if (!telegramResponse.success) {
    console.error('Failed to send via Telegram, falling back to email');
    await sendEmailResponse(ticket.email, response);
  }
}

    res.json({ 
      success: true,
      message: `Response sent via ${via}`
    });

  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to respond to ticket',
      code: 'RESPONSE_FAILED' 
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