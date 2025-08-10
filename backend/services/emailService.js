const nodemailer = require('nodemailer');
const { 
  registrationEmailTemplate,
  supportTicketTemplate,
  ticketResponseTemplate
} = require('./emailTemplate');

// Transporter tetap sama
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  }
});

// Fungsi existing (tidak diubah)
const sendRegistrationEmail = async (email, name) => {
  if (process.env.SKIP_EMAIL === 'true') {
    console.log(`[DEV] Skipping email to ${email}`);
    return { skipped: true };
  }

  try {
    const mailOptions = {
      from: `"Blasterc" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Account Has Been Successfully Registered on Blasterc',
      html: registrationEmailTemplate(name),
      text: `Hey ${name},\n\nYour account has been successfully registered!`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Registration email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Registration email error:', error);
    throw error;
  }
};

// Fungsi baru untuk support ticket
const notifyNewTicket = async (ticketId, subject, message, userName) => {
  if (process.env.SKIP_EMAIL === 'true') {
    console.log(`[DEV] Skipping ticket notification for #${ticketId}`);
    return { skipped: true };
  }

  try {
    const mailOptions = {
      from: `"Blasterc Support" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_USER, // Kirim ke admin email
      subject: `[Ticket #${ticketId}] ${subject}`,
      html: supportTicketTemplate(ticketId, subject, message, userName),
      text: `New ticket from ${userName}:\n\n${message}`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Ticket notification sent for #${ticketId}`);
    return info;
  } catch (error) {
    console.error('Ticket notification error:', error);
    throw error;
  }
};

// Fungsi baru untuk ticket response
const sendTicketResponse = async (userEmail, ticketId, response) => {
  try {
    const mailOptions = {
      from: `"Blasterc Support" <${process.env.EMAIL_FROM}>`,
      to: userEmail,
      subject: `Re: Your Support Ticket #${ticketId}`,
      html: ticketResponseTemplate(ticketId, response),
      text: `Regarding your ticket #${ticketId}:\n\n${response}`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Response sent for ticket #${ticketId}`);
    return info;
  } catch (error) {
    console.error('Ticket response error:', error);
    throw error;
  }
};

// Verifikasi koneksi (existing)
transporter.verify((error) => {
  if (error) {
    console.error('❌ SMTP Connection Failed:', error);
    if (process.env.NODE_ENV === 'production') process.exit(1);
  } else {
    console.log('✅ SMTP Server Connected');
  }
});


// In services/emailService.js
async function sendPasswordResetEmail(email, resetToken) {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Password Reset</h2>
          <p>You requested a password reset. Click the link below to set a new password:</p>
          <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
          <p>This link will expire in 30 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
      text: `You requested a password reset. Please use the following link to reset your password:\n\n${resetUrl}\n\nThis link will expire in 30 minutes. If you didn't request this, please ignore this email.`
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}

// Tambahkan fungsi ini di services/emailService.js
async function sendPasswordResetConfirmation(email) {
  try {
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@example.com';
    const appName = process.env.APP_NAME || 'Our App';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `[${appName}] Password Reset Confirmation`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333;">Password Successfully Reset</h2>
            <p style="color: #555;">Your password for ${appName} has been successfully updated.</p>
            
            <div style="margin: 20px 0; padding: 15px; background-color: #e9f7ef; border-radius: 4px;">
              <p style="margin: 0;">If you did not make this change, please contact our support team immediately at:</p>
              <p style="margin: 10px 0 0 0;">
                <a href="mailto:${supportEmail}" style="color: #2e86c1;">${supportEmail}</a>
              </p>
            </div>
            
            <p style="color: #777; font-size: 0.9em;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
      text: `
Password Successfully Reset

Your password for ${appName} has been successfully updated.

If you did not make this change, please contact our support team immediately at:
${supportEmail}

This is an automated message. Please do not reply to this email.
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset confirmation sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send password reset confirmation:', error);
    throw error;
  }
}


module.exports = {
  transporter,
  sendRegistrationEmail,
  notifyNewTicket,
  sendTicketResponse,
  sendPasswordResetEmail,  // Add this line
  sendPasswordResetConfirmation
};