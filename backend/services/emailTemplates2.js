// Template untuk email registrasi (existing)
exports.registrationEmailTemplate = (name) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #2563eb;">Welcome to Blasterc, ${name}!</h2>
    <p>Your account has been successfully registered.</p>
    <a href="${process.env.FRONTEND_URL}/login" 
       style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
       Login to Your Account
    </a>
  </div>
`;

// Template untuk notifikasi ticket baru ke admin
exports.supportTicketTemplate = (ticketId, subject, message, userName) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #dc2626;">New Support Ticket #${ticketId}</h2>
    <p><strong>From:</strong> ${userName}</p>
    <p><strong>Subject:</strong> ${subject}</p>
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
      ${message.replace(/\n/g, '<br>')}
    </div>
    <a href="${process.env.ADMIN_URL}/support/tickets/${ticketId}" 
       style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
       View Ticket
    </a>
  </div>
`;

// Template untuk response ticket ke user
exports.ticketResponseTemplate = (ticketId, response) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #2563eb;">Your Ticket #${ticketId}</h2>
    <p>We've responded to your support request:</p>
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
      ${response.replace(/\n/g, '<br>')}
    </div>
    <p>If you have further questions, reply to this email.</p>
  </div>
`;