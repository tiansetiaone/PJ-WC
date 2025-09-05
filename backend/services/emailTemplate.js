const registrationEmailTemplate = (userName) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .header { color: #2c3e50; }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #3498db;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            margin: 15px 0;
        }
        .footer { 
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #777;
        }
        .ticket { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>BLASTERC</h2>
        <h3>Account Has Been Successfully Registered</h3>
    </div>

    <p>Hey ${userName},</p>
    <p>Congratulations! Your account has been successfully registered!</p>
    <p>We can't wait you anymore. Go to Log in now.</p>

    <a href="${process.env.FRONTEND_URL}/login" class="button">Log in</a>

    <div class="footer">
        <p>Best regards,<br>Blasterc</p>
        <p>You've received this email because you are our beloved users.</p>
        <p>Blasterc<br>
        Merdeka Square, Jakarta, Jalan Lapangan Monas, Gambir,<br>
        Central Jakarta City, Jakarta 10110</p>
    </div>
</body>
</html>
`;

// Template baru untuk support ticket
const supportTicketTemplate = (ticketId, subject, message, userName) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        /* Pertahankan style yang sama */
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .header { color: #2c3e50; }
        .button { 
            /* Style tombol yang sama */
        }
        .ticket { 
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid #3498db;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>BLASTERC SUPPORT</h2>
        <h3>New Ticket #${ticketId}: ${subject}</h3>
    </div>

    <p><strong>From:</strong> ${userName}</p>
    
    <div class="ticket">
        ${message.replace(/\n/g, '<br>')}
    </div>

    <a href="${process.env.FRONTEND_URL}/support/tickets/${ticketId}" class="button">
        View Ticket
    </a>

    <div class="footer">
        <p>Please respond within 24 hours.</p>
        <p>Best regards,<br>Blasterc Support Team</p>
    </div>
</body>
</html>
`;

// Template baru untuk ticket response
const ticketResponseTemplate = (ticketId, response) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        /* Gunakan style yang konsisten */
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .response { 
            background-color: #e8f4fd;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>BLASTERC SUPPORT</h2>
        <h3>Your Ticket #${ticketId} Has Been Responded</h3>
    </div>

    <p>Dear Valued Customer,</p>
    
    <div class="response">
        ${response.replace(/\n/g, '<br>')}
    </div>

    <p>If you have any further questions, reply to this email.</p>

    <div class="footer">
        <p>Best regards,<br>Blasterc Support Team</p>
    </div>
</body>
</html>
`;


// emailTemplate.js - Tambahkan fungsi-fungsi ini

function registrationUnderReviewTemplate(name) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
        <h2 style="color: #2c3e50; font-weight: bold; text-align: center;">
          Account Registration Under Checking
        </h2>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #ffffff; border-radius: 4px;">
          <p>Hey <strong>${name}</strong>,</p>
          <p>Your account registration is under checking in our system, please wait any moments, it doesn't take long. We'll inform you again if the account successfully registered.</p>
        </div>
        
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; color: #777; text-align: center;">
          <p><strong>Best regards,</strong></p>
          <p style="font-weight: bold;">Blasterc</p>
        </div>
      </div>
    </div>
  `;
}

function registrationFailedTemplate(name) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
        <h2 style="color: #e74c3c; font-weight: bold; text-align: center;">
          Account Has Been Failed to Register
        </h2>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #ffffff; border-radius: 4px;">
          <p>Hey <strong>${name}</strong>,</p>
          <p>Your account has been failed to register.</p>
          <p>Please make sure and submit a new register account request. Hope this problem doesn't make you a bad day. We will wait your next move to us!</p>
        </div>
        
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; color: #777; text-align: center;">
          <p><strong>Best regards,</strong></p>
          <p style="font-weight: bold;">Blasterc</p>
        </div>
      </div>
    </div>
  `;
}


module.exports = { 
  registrationEmailTemplate,
  supportTicketTemplate,
  ticketResponseTemplate,
registrationUnderReviewTemplate,
  registrationFailedTemplate
};