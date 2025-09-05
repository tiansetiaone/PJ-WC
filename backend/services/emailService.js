const nodemailer = require("nodemailer");
const { registrationEmailTemplate, supportTicketTemplate, ticketResponseTemplate, registrationFailedTemplate, registrationUnderReviewTemplate } = require("./emailTemplate");

// Transporter tetap sama
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === "production",
  },
});

// Fungsi existing (tidak diubah)
const sendRegistrationEmail = async (email, name) => {
  if (process.env.SKIP_EMAIL === "true") {
    console.log(`[DEV] Skipping email to ${email}`);
    return { skipped: true };
  }

  try {
    const mailOptions = {
      from: `"Blasterc" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Account Has Been Successfully Registered on Blasterc",
      html: registrationEmailTemplate(name),
      text: `Hey ${name},\n\nYour account has been successfully registered!`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Registration email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Registration email error:", error);
    throw error;
  }
};

// Fungsi baru untuk support ticket
const notifyNewTicket = async (ticketId, subject, message, userName) => {
  if (process.env.SKIP_EMAIL === "true") {
    console.log(`[DEV] Skipping ticket notification for #${ticketId}`);
    return { skipped: true };
  }

  try {
    const mailOptions = {
      from: `"Blasterc Support" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_USER, // Kirim ke admin email
      subject: `[Ticket #${ticketId}] ${subject}`,
      html: supportTicketTemplate(ticketId, subject, message, userName),
      text: `New ticket from ${userName}:\n\n${message}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Ticket notification sent for #${ticketId}`);
    return info;
  } catch (error) {
    console.error("Ticket notification error:", error);
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
      text: `Regarding your ticket #${ticketId}:\n\n${response}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Response sent for ticket #${ticketId}`);
    return info;
  } catch (error) {
    console.error("Ticket response error:", error);
    throw error;
  }
};

// Verifikasi koneksi (existing)
transporter.verify((error) => {
  if (error) {
    console.error("❌ SMTP Connection Failed:", error);
    if (process.env.NODE_ENV === "production") process.exit(1);
  } else {
    console.log("✅ SMTP Server Connected");
  }
});

// Di services/emailService.js
async function sendPasswordResetEmail(email, resetToken) {
  try {
    // Gunakan FRONTEND_URL dari environment variable atau default ke localhost
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;
    const appName = process.env.APP_NAME || "Blasterc";

    const mailOptions = {
      from: `"${appName} Support" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: `${appName} - Password Reset Request`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
            <h2 style="color: #2c3e50;">Password Reset Request</h2>
            <p>You recently requested to reset your password for your ${appName} account.</p>
            
            <div style="margin: 20px 0; text-align: center;">
              <a href="${resetLink}" 
                 style="display: inline-block; background-color: #3498db; color: white; 
                        padding: 12px 24px; text-decoration: none; border-radius: 4px;
                        font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p>This link will expire in 30 minutes. If you didn't request a password reset, 
               please ignore this email or contact support if you have concerns.</p>
            
            <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; 
                        color: #777; font-size: 0.9em;">
              <p>If the button above doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all;">${resetLink}</p>
            </div>
          </div>
        </div>
      `,
      text: `
Password Reset Request

You recently requested to reset your password for your ${appName} account.
Click the link below to reset your password:

${resetLink}

This link will expire in 30 minutes. If you didn't request a password reset, 
please ignore this email or contact support if you have concerns.
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    return { success: true, resetLink };
  } catch (error) {
    console.error("Error sending password reset email:", {
      error: error.message,
      email,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

// Tambahkan fungsi ini di services/emailService.js
async function sendPasswordResetConfirmation(email) {
  try {
    const supportEmail = process.env.SUPPORT_EMAIL || "support@example.com";
    const appName = process.env.APP_NAME || "Our App";

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
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset confirmation sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Failed to send password reset confirmation:", error);
    throw error;
  }
}

async function sendVerificationRequestEmail(email, ticketId, subject, message) {
  try {
    // Validate required environment variables
    if (!process.env.ADMIN_EMAIL) {
      throw new Error("ADMIN_EMAIL is not configured");
    }

    const mailOptions = {
      from: `"Blasterc Support" <${process.env.EMAIL_FROM}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `[Verification] Ticket #${ticketId}: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px;">
          <h2 style="color: #2c3e50;">New Verification Request</h2>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p><strong>Ticket ID:</strong> #${ticketId}</p>
            <p><strong>User Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          
          <a href="${process.env.ADMIN_DASHBOARD_URL}/verify-user?email=${encodeURIComponent(email)}&ticket=${ticketId}" 
             style="display: inline-block; background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 10px;">
            Verify This Account
          </a>
          
          <p style="margin-top: 20px; color: #7f8c8d; font-size: 0.9em;">
            This request was generated by the user via the verification system.
          </p>
        </div>
      `,
      text: `
New Verification Request (Ticket #${ticketId})

User Email: ${email}
Message: ${message}

Verify this account: ${process.env.ADMIN_DASHBOARD_URL}/verify-user?email=${encodeURIComponent(email)}&ticket=${ticketId}
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Verification request email sent for ticket #${ticketId}`);
    return info;
  } catch (error) {
    console.error("Failed to send verification email:", {
      error: error.message,
      ticketId,
      recipient: process.env.ADMIN_EMAIL,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

// Tambahkan fungsi-fungsi baru
async function sendAdminVerificationRequest(email, userId, userName) {
  try {
    // Bukan langsung ke /admin/verify-user, tapi ke /login?redirect=...
    const verificationPath = `/admin/verify-user/${userId}`;
    const verificationLink = `${process.env.FRONTEND_URL}/login?redirect=${encodeURIComponent(verificationPath)}`;

    const mailOptions = {
      from: `"${process.env.APP_NAME || "Blasterc"}" <${process.env.EMAIL_FROM}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `[Action Required] New User Verification - ${userName || email}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
            <h2 style="color: #2c3e50;">New User Verification Required</h2>
            
            <div style="margin: 20px 0; padding: 15px; background-color: #e9f7ef; border-radius: 4px;">
              <p><strong>User Email:</strong> ${email}</p>
              <p><strong>User Name:</strong> ${userName || "Not provided"}</p>
              <p><strong>Action Required:</strong> Please verify this new registration</p>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${verificationLink}" 
                 style="display: inline-block; background-color: #4CAF50; color: white; 
                        padding: 12px 24px; text-decoration: none; border-radius: 4px;
                        font-weight: bold;">
                Verify User Now
              </a>
            </div>
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; color: #777;">
              <p>This link will expire in 24 hours. If you didn't request this verification, 
                 please contact your system administrator.</p>
            </div>
          </div>
        </div>
      `,
      text: `
New User Verification Required

User Email: ${email}
User Name: ${userName || "Not provided"}

Please verify this new registration by logging in:
${verificationLink}

This link will expire in 24 hours. If you didn't request this verification, please ignore this email.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent:", {
      userId,
      email,
      messageId: info.messageId,
      timestamp: new Date().toISOString(),
    });

    return { success: true, verificationLink };
  } catch (error) {
    console.error("Failed to send verification email:", {
      error: error.message,
      userId,
      email,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

async function sendAccountApprovalEmail(email, name) {
  try {
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    const mailOptions = {
      from: `"Blasterc" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Your Account Has Been Approved",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Welcome to Blasterc, ${name}!</h2>
          <p>Your account has been approved by our admin team.</p>
          <p>You can now login and start using our services:</p>
          <a href="${loginUrl}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
            Login Now
          </a>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      `,
      text: `Your account has been approved. Login here: ${loginUrl}`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Account approval email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send account approval email:", error);
    throw error;
  }
}

async function sendAccountBlockedEmail(email, name, reason) {
  try {
    const supportEmail = process.env.SUPPORT_EMAIL || "support@blasterc.com";
    const mailOptions = {
      from: `"Blasterc Support" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Your Account Has Been Blocked",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Account Status Update</h2>
          <p>Dear ${name},</p>
          <p>We regret to inform you that your account has been blocked by our admin team.</p>
          <p><strong>Reason:</strong> ${reason || "Violation of terms of service"}</p>
          <p>If you believe this is a mistake, please contact our support team at:</p>
          <a href="mailto:${supportEmail}">${supportEmail}</a>
          <p>Thank you for your understanding.</p>
        </div>
      `,
      text: `Your account has been blocked. Reason: ${reason || "Violation of terms of service"}. Contact support at ${supportEmail} if you have questions.`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Account blocked notification sent to ${email}`);
  } catch (error) {
    console.error("Failed to send account blocked email:", error);
    throw error;
  }
}



async function sendRegistrationUnderReviewEmail(email, name) {
  if (process.env.SKIP_EMAIL === "true") {
    console.log(`[DEV] Skipping under review email to ${email}`);
    return { skipped: true };
  }

  try {
    const mailOptions = {
      from: `"Blasterc" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Account Registration Under Review",
      html: registrationUnderReviewTemplate(name),
      text: `Hey ${name},\n\nYour account registration is under checking in our system, please wait any moments. We'll inform you again if the account successfully registered.\n\nBest regards,\nBlasterc`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Registration under review email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Registration under review email error:", error);
    throw error;
  }
}

async function sendRegistrationFailedEmail(email, name) {
  if (process.env.SKIP_EMAIL === "true") {
    console.log(`[DEV] Skipping registration failed email to ${email}`);
    return { skipped: true };
  }

  try {
    const mailOptions = {
      from: `"Blasterc" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Account Registration Failed",
      html: registrationFailedTemplate(name),
      text: `Hey ${name},\n\nYour account has been failed to register. Please make sure and submit a new register account request. Hope this problem doesn't make you a bad day. We will wait your next move to us!\n\nBest regards,\nBlasterc`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Registration failed email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Registration failed email error:", error);
    throw error;
  }
}

module.exports = {
  transporter,
  sendRegistrationEmail,
  notifyNewTicket,
  sendTicketResponse,
  sendPasswordResetEmail, // Add this line
  sendPasswordResetConfirmation,
  sendVerificationRequestEmail,
  sendAccountApprovalEmail,
  sendAccountBlockedEmail,
  sendAdminVerificationRequest,
  sendRegistrationUnderReviewEmail,
  sendRegistrationFailedEmail
};
