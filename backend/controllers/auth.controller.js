const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios'); 
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { 
  sendRegistrationEmail, 
  transporter,
  sendPasswordResetEmail,  // Tambahkan ini
  sendPasswordResetConfirmation,  // Tambahkan ini jika diperlukan
  sendAdminVerificationRequest,
  sendAccountApprovalEmail,
  sendAccountBlockedEmail,
  sendVerificationRequestEmail,
  notifyNewTicket,
  sendRegistrationFailedEmail,
  sendRegistrationUnderReviewEmail,
  sendTicketResponse
} = require('../services/emailService');
const crypto = require('crypto');
require('dotenv').config();

exports.googleAuth = async (req, res) => {
  try {
    const { token: googleToken } = req.body;
    
    if (!googleToken) return res.status(400).json({ error: 'Token required' });

    // Verifikasi token Google
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { given_name, family_name, email, sub } = ticket.getPayload();
    const username = email.split('@')[0];
    const name = `${given_name} ${family_name}`;

    // 1. Cek user existing
    const [existingUser] = await db.query(
      'SELECT * FROM users WHERE email = ?', 
      [email]
    );

    if (existingUser.length > 0) {
      const jwtToken = generateToken(existingUser[0]);
      return res.json({ 
        token: jwtToken, 
        user: existingUser[0] 
      });
    }

    // 2. Insert user baru DENGAN provider='google'
    await db.query(
      `INSERT INTO users 
      (name, username, email, password, role, created_at, provider) 
      VALUES (?, ?, ?, ?, 'user', NOW(), 'google')`,
      [name, username, email, sub] // sub (Google ID) sebagai password
    );

    // 3. Debugging: Log hasil query
    console.log(`User ${email} berhasil didaftarkan via Google`);

    // 4. Ambil data user baru
    const [newUser] = await db.query(
      'SELECT * FROM users WHERE email = ?', 
      [email]
    );

    if (!newUser.length) {
      throw new Error('Gagal mengambil user setelah pendaftaran');
    }

    // 5. Kirim response
    const jwtToken = generateToken(newUser[0]);
    res.json({ 
      token: jwtToken,
      user: {
        id: newUser[0].id,
        name: newUser[0].name,
        email: newUser[0].email,
        role: newUser[0].role,
        provider: newUser[0].provider // Pastikan ini ada di response
      }
    });

  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ 
      error: 'Authentication failed',
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};

// Fungsi pembantu untuk generate token
function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}


exports.registerUser = async (req, res) => {
  const { 
    name, 
    username, 
    email, 
    password, 
    password_confirmation,
    whatsapp_number = null, 
    usdt_network = 'TRC20',
    usdt_address = null,
    acceptTerms,
    hCaptchaToken,
    referral_code = null
  } = req.body;

  // Enhanced input validation with referral code check
  const validation = validateRegistrationInput({
    ...req.body,
    password_confirmation
  });

  if (!validation.valid) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.errors,
      code: 'VALIDATION_ERROR'
    });
  }

  if (password !== password_confirmation) {
    return res.status(400).json({
      error: 'Password confirmation does not match',
      code: 'PASSWORD_MISMATCH',
      field: 'password_confirmation'
    });
  }

  try {
    // hCaptcha verification
    const captchaVerification = await verifyHCaptcha(hCaptchaToken);
    if (!captchaVerification.success) {
      return res.status(400).json({
        error: captchaVerification.error || 'Captcha verification failed',
        code: captchaVerification.code || 'INVALID_CAPTCHA',
        details: process.env.NODE_ENV === 'development' ? captchaVerification : undefined
      });
    }

    // Check referral code
     // Check referral code
    let referrer_id = null;
    let referrer_data = null;
    if (referral_code) {
      const [referrer] = await db.query(
        'SELECT id FROM users WHERE referral_code = ?', 
        [referral_code]
      );
      
      if (!referrer.length) {
        return res.status(400).json({ 
          error: 'Invalid referral code',
          code: 'INVALID_REFERRAL' 
        });
      }
      referrer_id = referrer[0].id;
      referrer_data = referrer[0];
    }

    // User registration
    const registrationResult = await registerNewUser({
      name, 
      username, 
      email, 
      password,
      whatsapp_number, 
      usdt_network: usdt_address ? usdt_network : null,
      usdt_address: usdt_address || null,
      referrer_id
    });

// Record referral if valid code was provided
if (referrer_id) {
  try {
    await db.query(
      'INSERT INTO referrals (referrer_id, referred_id) VALUES (?, ?)',
      [referrer_id, registrationResult.userId]
    );
    
    registrationResult.referral = {
      referrer_id,
      recorded: true
    };
  } catch (err) {
    console.error('Failed to record referral:', err);
    registrationResult.referral_error = err.message;
  }
}


    // Email notifications - MODIFIED SECTION
    try {
      // Kirim email ke user bahwa registrasi sedang dalam review
      await sendRegistrationUnderReviewEmail(email, name);
      registrationResult.emailSent = true;

      // Kirim permintaan verifikasi ke admin
      await sendAdminVerificationRequest(email, registrationResult.userId, name);
      
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      registrationResult.emailSent = false;
      registrationResult.emailError = emailError.message;
    }

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Waiting for admin approval.',
      ...registrationResult,
      is_active: registrationResult.is_active,
      captchaVerification: {
        success: true,
        hostname: captchaVerification.hostname
      }
    });

  } catch (err) {
    console.error('Registration error:', {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};


// Enhanced hCaptcha Verification with better error handling
async function verifyHCaptcha(token) {
  // Skip verification in development if using test token
  if (process.env.NODE_ENV !== 'production' && token === "10000000-ffff-ffff-ffff-000000000001") {
    console.warn('[DEV] Bypassing hCaptcha verification');
    return { 
      success: true, 
      isTest: true,
      hostname: 'localhost'
    };
  }

  try {
    const response = await axios.post(
      'https://hcaptcha.com/siteverify',
      new URLSearchParams({
        secret: process.env.HCAPTCHA_SECRET,
        response: token
      }),
      { 
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (!response.data?.success) {
      console.error('hCaptcha verification failed:', response.data);
      return {
        success: false,
        errorCodes: response.data['error-codes'] || [],
        code: 'HCAPTCHA_VERIFICATION_FAILED'
      };
    }

    return {
      success: true,
      hostname: response.data.hostname
    };

  } catch (err) {
    console.error('hCaptcha API Error:', {
      message: err.message,
      code: err.code,
      status: err.response?.status,
      data: err.response?.data
    });
    return {
      success: false,
      error: err.message,
      code: 'HCAPTCHA_API_ERROR'
    };
  }
}

// Helper functions
function validateRegistrationInput(data) {
  const errors = {};
  const requiredFields = [
    'name', 
    'username', 
    'email', 
    'password', 
    'password_confirmation',
    'acceptTerms', 
    'hCaptchaToken'
  ];

  // Validasi field required
  requiredFields.forEach(field => {
    if (!data[field]) {
      errors[field] = `${field.replace('_', ' ')} is required`;
    }
  });

  // Validasi email
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email format';
  }

  // Validasi username
  if (data.username) {
    if (data.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }
  }

  // Validasi password
  if (data.password) {
    if (data.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(data.password)) {
      errors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(data.password)) {
      errors.password = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(data.password)) {
      errors.password = 'Password must contain at least one number';
    }
  }

  // Validasi konfirmasi password
  if (data.password && data.password_confirmation) {
    if (data.password !== data.password_confirmation) {
      errors.password_confirmation = 'Passwords do not match';
    }
  }

  // Validasi nomor WhatsApp (jika diisi)
  if (data.whatsapp_number && !/^\+?[\d\s-]{10,}$/.test(data.whatsapp_number)) {
    errors.whatsapp_number = 'Please enter a valid WhatsApp number';
  }

  // Validasi alamat USDT (jika diisi)
  if (data.usdt_address && data.usdt_address.length < 10) {
    errors.usdt_address = 'USDT address must be at least 10 characters';
  }

  // Validasi terms and conditions
  if (data.acceptTerms !== true) {
    errors.acceptTerms = 'You must accept the terms and conditions';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}


// Updated registerNewUser function
async function registerNewUser(userData) {
  const [existingUser] = await db.query(
    `SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1`, 
    [userData.username, userData.email]
  );
  
  if (existingUser.length > 0) {
    throw new Error('Username or email already exists');
  }

  const hashedPassword = await bcrypt.hash(userData.password, 12);
  const referralCode = generateReferralCode(userData.username);
  
  // Tentukan nilai is_active secara eksplisit
  const is_active = (process.env.REQUIRE_ADMIN_VERIFICATION === 'true') ? 0 : 1;

  const [result] = await db.query(
    `INSERT INTO users 
     (name, username, email, password, whatsapp_number, 
      usdt_network, usdt_address, referral_code, referred_by,
      role, created_at, provider, is_active) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'user', NOW(), 'local', ?)`,
    [
      userData.name,
      userData.username,
      userData.email,
      hashedPassword,
      userData.whatsapp_number,
      userData.usdt_network,
      userData.usdt_address,
      referralCode,
      userData.referrer_id || null,
      is_active // Gunakan nilai yang sudah ditentukan
    ]
  );

  return {
    userId: result.insertId,
    username: userData.username,
    email: userData.email,
    referralCode,
    is_active // Kembalikan status aktual
  };
}


// Helper function to generate referral code
function generateReferralCode(username) {
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${username.substring(0, 4)}${randomPart}`.toUpperCase();
}

// Updated validateRegistrationInput
function validateRegistrationInput(data) {
  const errors = [];
  const requiredFields = ['name', 'username', 'email', 'password', 'acceptTerms', 'hCaptchaToken'];
  
  requiredFields.forEach(field => {
    if (!data[field]) {
      errors.push(`${field} is required`);
    }
  });

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }

  if (data.password && data.password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (data.referral_code && !/^[A-Z0-9]{8,12}$/.test(data.referral_code)) {
    errors.push('Referral code must be 8-12 alphanumeric characters');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query(`SELECT * FROM users WHERE email = ?`, [email]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Enhanced account status check
    if (user.is_active !== 1) {
      let errorMessage, errorCode;
      
      if (user.deleted_at) {
        errorMessage = 'Account blocked. Please contact support.';
        errorCode = 'ACCOUNT_BLOCKED';
      } else if (user.is_active === 0) {
        errorMessage = 'Account pending admin verification.';
        errorCode = 'PENDING_VERIFICATION';
      } else {
        errorMessage = 'Account not active';
        errorCode = 'ACCOUNT_INACTIVE';
      }

      return res.status(403).json({
        error: errorMessage,
        code: errorCode,
        is_active: user.is_active,
        deleted_at: user.deleted_at
      });
    }

    // Handle Google-registered users attempting password login
    if (user.provider === 'google' && password) {
      return res.status(400).json({ 
        error: 'This account uses Google login. Please sign in with Google.',
        code: 'GOOGLE_AUTH_REQUIRED'
      });
    }

    // Handle password login
    if (user.provider === 'local') {
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(400).json({ 
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }
    }

    // Generate token only if all checks pass
    const token = generateToken(user);
    
    // Return user data with balance included
    res.json({ 
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        provider: user.provider,
        is_active: user.is_active,
        balance: user.balance, // Tambahkan balance di sini
        username: user.username, // Tambahkan field lainnya jika diperlukan
        usdt_address: user.usdt_address,
        usdt_network: user.usdt_network
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      error: 'Login failed',
      code: 'LOGIN_FAILED',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Add this to your auth.controller.js

exports.forgotPassword = async (req, res) => {
  const { email, hCaptchaToken } = req.body;
  
  try {
    // Verify hCaptcha
    const hCaptchaValid = await verifyHCaptcha(hCaptchaToken);
    if (!hCaptchaValid) {
      return res.status(400).json({ 
        error: 'Captcha verification failed',
        code: 'INVALID_CAPTCHA'
      });
    }

    const [user] = await db.query('SELECT * FROM users WHERE email = ? AND provider = "local"', [email]);
    if (!user.length) {
      return res.status(404).json({ 
        error: 'Email not found',
        code: 'EMAIL_NOT_FOUND'
      });
    }

    // Generate token with crypto
const resetToken = crypto.randomBytes(20).toString('hex');
    const resetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 meni
    
    await db.query(
      'UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?',
      [resetToken, resetExpires, user[0].id]
    );

    // Send email with reset link
    try {
      await sendPasswordResetEmail(email, resetToken);
      res.json({ 
        success: true,
        message: 'Password reset instructions sent to your email',
        code: 'RESET_EMAIL_SENT',
        resetToken: resetToken, // Sertakan token dalam response
        expiresAt: resetExpires // Sertakan waktu kedaluwarsa
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      res.status(500).json({
        error: 'Failed to send reset email',
        code: 'EMAIL_SEND_FAILURE',
        resetToken: resetToken, // Tetap kembalikan token meski email gagal
        expiresAt: resetExpires
      });
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ 
      error: 'Password reset failed',
      code: 'RESET_FAILED',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword, hCaptchaToken } = req.body;
  
  try {
    // Input validation
    if (!token || !newPassword || !hCaptchaToken) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'MISSING_FIELDS',
        required: ['token', 'newPassword', 'hCaptchaToken']
      });
    }

    // Verify hCaptcha
    const hCaptchaValid = await verifyHCaptcha(hCaptchaToken);
    if (!hCaptchaValid.success) {
      return res.status(400).json({ 
        error: 'Captcha verification failed',
        code: 'INVALID_CAPTCHA',
        details: hCaptchaValid
      });
    }

    // Check password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters',
        code: 'WEAK_PASSWORD'
      });
    }

    // Check token validity
    const [user] = await db.query(
      'SELECT * FROM users WHERE reset_token = ? AND reset_expires > NOW()',
      [token]
    );
    
    if (!user.length) {
      return res.status(400).json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Update password
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
      [hashed, user[0].id]
    );

    // Send confirmation email
    try {
      await sendPasswordResetConfirmation(user[0].email);
    } catch (emailError) {
      console.error('Confirmation email failed:', emailError);
      // Don't fail the request if confirmation email fails
    }

    res.json({ 
      success: true,
      message: 'Password updated successfully',
      code: 'PASSWORD_UPDATED',
      email: user[0].email // Sertakan email yang direset
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ 
      error: 'Password reset failed',
      code: 'RESET_FAILED',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Add this new function to emailService.js
// async function sendPasswordResetConfirmation(email) {
//   try {
//     const mailOptions = {
//       from: process.env.EMAIL_FROM,
//       to: email,
//       subject: 'Your Password Has Been Reset',
//       html: `
//         <div style="font-family: Arial, sans-serif;">
//           <h2>Password Reset Confirmation</h2>
//           <p>Your password has been successfully reset.</p>
//           <p>If you didn't initiate this change, please contact support immediately.</p>
//         </div>
//       `,
//       text: `Your password has been successfully reset. If you didn't initiate this change, please contact support immediately.`
//     };

//     await transporter.sendMail(mailOptions);
//     console.log(`Password reset confirmation sent to ${email}`);
//   } catch (error) {
//     console.error('Confirmation email failed:', error);
//     throw error;
//   }
// }


exports.getResetToken = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                error: 'Email parameter is required',
                code: 'EMAIL_REQUIRED'
            });
        }

        // Pertama cek apakah kolom ada
        const [columns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users' 
            AND COLUMN_NAME IN ('reset_token', 'reset_expires')
        `);

        if (columns.length < 2) {
            return res.status(501).json({
                error: 'Reset functionality not configured',
                code: 'MISSING_COLUMNS',
                required_columns: ['reset_token', 'reset_expires'],
                existing_columns: columns.map(c => c.COLUMN_NAME)
            });
        }

        const [user] = await db.query(
            'SELECT reset_token, reset_expires FROM users WHERE email = ?',
            [email]
        );

        if (!user.length) {
            return res.status(404).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            email: email,
            reset_token: user[0].reset_token,
            reset_expires: user[0].reset_expires,
            is_valid: user[0].reset_expires && new Date(user[0].reset_expires) > new Date()
        });

    } catch (err) {
        console.error('Debug getResetToken error:', err);
        
        if (err.code === 'ER_BAD_FIELD_ERROR') {
            return res.status(501).json({
                error: 'Database columns missing',
                code: 'DB_SCHEMA_ERROR',
                message: 'The required columns (reset_token, reset_expires) are missing in users table',
                solution: 'Run database migration to add these columns'
            });
        }

        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};


// controllers/auth.controller.js
exports.getVerifyUserPage = async (req, res) => {
  const { id } = req.params;
  
  try {
    const [user] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    if (!user.length) {
      return res.status(404).send('User not found');
    }

    // Render verification page with user data
    res.render('admin/verify-user', { 
      user: user[0],
      layout: 'admin-layout' // If using a template engine with layouts
    });
  } catch (err) {
    console.error('Error fetching user for verification:', err);
    res.status(500).send('Internal server error');
  }
};

// auth.controller.js - Modifikasi fungsi verifyUser yang sudah ada
exports.verifyUser = async (req, res) => {
  const { user_id, action, reason } = req.body;
  
  try {
    const [user] = await db.query('SELECT * FROM users WHERE id = ?', [user_id]);
    if (!user.length) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const userData = user[0];
    
    if (action === 'approve') {
      await db.query(
        'UPDATE users SET is_active = 1, verified_at = NOW() WHERE id = ?',
        [user_id]
      );
      
      // Kirim email pemberitahuan ke user
      await sendAccountApprovalEmail(userData.email, userData.name);
      
      return res.json({ 
        success: true,
        message: 'User approved successfully',
        code: 'USER_APPROVED'
      });
    } 
    
    if (action === 'block') {
      await db.query(
        'UPDATE users SET is_active = 0, deleted_at = NOW(), blocked_reason = ? WHERE id = ?',
        [reason || 'Blocked by admin', user_id]
      );
      
      // Kirim email pemberitahuan ke user
      await sendAccountBlockedEmail(
        userData.email, 
        userData.name, 
        reason || 'Blocked by admin'
      );
      
      return res.json({ 
        success: true,
        message: 'User blocked successfully',
        code: 'USER_BLOCKED'
      });
    }
    
    // Tambahkan case untuk action 'failed'
    if (action === 'failed') {
      // Untuk kasus registrasi gagal (tidak perlu update status user, hanya kirim email)
      // Kirim email pemberitahuan gagal ke user
      await sendRegistrationFailedEmail(userData.email, userData.name);
      
      return res.json({ 
        success: true,
        message: 'User registration marked as failed',
        code: 'REGISTRATION_FAILED'
      });
    }

    return res.status(400).json({ 
      error: 'Invalid action',
      code: 'INVALID_ACTION'
    });

  } catch (err) {
    console.error('Admin verification error:', err);
    res.status(500).json({ 
      error: 'Verification failed',
      code: 'VERIFICATION_FAILED',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.checkAccountStatus = async (req, res) => {
  const { email } = req.query;
  
  try {
    if (!email) {
      return res.status(400).json({
        error: 'Email parameter is required',
        code: 'EMAIL_REQUIRED'
      });
    }

    const [user] = await db.query(
      'SELECT id, email, is_active, deleted_at FROM users WHERE email = ?',
      [email]
    );

    if (!user.length) {
      return res.status(404).json({
        error: 'Account not found',
        code: 'ACCOUNT_NOT_FOUND'
      });
    }

    res.json({
      email: user[0].email,
      is_active: user[0].is_active,
      is_blocked: user[0].deleted_at !== null,
      status: user[0].deleted_at ? 'blocked' : 
             (user[0].is_active ? 'active' : 'pending_verification')
    });

  } catch (err) {
    res.status(500).json({
      error: 'Failed to check account status',
      code: 'STATUS_CHECK_FAILED'
    });
  }
};


// controllers/adminController.js
// Di auth.controller.js
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [users] = await db.query(`
      SELECT 
        u.id, 
        u.name, 
        u.username,
        u.email, 
        u.whatsapp_number,
        u.referral_code, 
        u.is_active, 
        u.created_at, 
        u.provider,
        u.deleted_at,
        u.verified_at,
        u.balance,
        u.total_credit
      FROM users u
      WHERE u.id = ?
    `, [id]);

    if (!users.length) {
      return res.status(404).json({
        error: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    const user = users[0];
    const mappedUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.whatsapp_number || null,
      referral: user.referral_code,
      status: user.deleted_at 
        ? "Register Failed"
        : user.is_active === 1
          ? "Register Success"
          : "Checking Register",
      date: user.created_at,
      provider: user.provider,
      verified_at: user.verified_at,
      balance: user.balance,
      total_credit: user.total_credit,
      is_active: user.is_active,
      deleted_at: user.deleted_at
    };

    res.json(mappedUser);

  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({
      error: "Failed to fetch user",
      code: "FETCH_USER_FAILED"
    });
  }
};


exports.getProfileWithConversionRules = async (req, res) => {
  try {
    const [user] = await db.query(
      'SELECT id, name, email, role FROM users WHERE id = ?', 
      [req.user.id] // req.user.id diisi dari middleware auth
    );

    if (!user.length) {
      return res.status(404).json({ error: "User not found" });
    }

    let min_conversion = 10; // default
    if (user[0].role === "vip") min_conversion = 5;
    if (user[0].role === "admin") min_conversion = 0;

    res.json({
      ...user[0],
      min_conversion
    });
  } catch (err) {
    console.error("Error fetching user profile with rules", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


// controllers/auth.controller.js

exports.getAllUsers = async (req, res) => {
  try {
    // Ambil semua user
const [users] = await db.query(`
  SELECT 
    u.id, 
    u.name, 
    u.username,
    u.email, 
    u.whatsapp_number,
    u.referral_code, 
    u.is_active, 
    u.created_at, 
    u.provider,
    u.deleted_at,
    u.verified_at,
    u.balance,
    u.total_credit
  FROM users u
  LEFT JOIN deposits d ON u.id = d.user_id
  GROUP BY u.id
  ORDER BY u.created_at DESC
`);

    if (!users.length) {
      return res.status(200).json([]);
    }

    // Mapping ke format yang lebih rapi untuk frontend
const mappedUsers = users.map(u => ({
  id: u.id,
  name: u.name,
  username: u.username,
  email: u.email,
  phone: u.whatsapp_number || null,
  referral : u.referral_code,
  status: u.deleted_at 
    ? "Register Failed"
    : u.is_active === 1
      ? "Register Success"
      : "Checking Register",
  date: u.created_at,
  provider: u.provider,
  verified_at: u.verified_at,
  balance: u.balance,
  total_credit: u.total_credit
}));

    res.json(mappedUsers);

  } catch (err) {
    console.error("Error fetching all users:", err);
    res.status(500).json({
      error: "Failed to fetch users",
      code: "FETCH_USERS_FAILED",
      details: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
};


// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    // hanya admin yang boleh
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }

    const { id } = req.params;

    // cek apakah user ada
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // hapus user
    await db.query("DELETE FROM users WHERE id = ?", [id]);

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


// controllers/auth.controller.js
exports.adminResetPassword = async (req, res) => {
  const { user_id } = req.body;

  try {
    const [user] = await db.query("SELECT * FROM users WHERE id = ?", [user_id]);
    if (!user.length) {
      return res.status(404).json({ error: "User not found", code: "USER_NOT_FOUND" });
    }

    // Generate password baru random
    const newPassword = crypto.randomBytes(6).toString("hex"); // contoh: "a3f9b1c4"
    const hashed = await bcrypt.hash(newPassword, 10);

    // Update password di DB
    await db.query("UPDATE users SET password = ? WHERE id = ?", [hashed, user_id]);

    // Kirim email ke user dengan password baru
    await sendPasswordResetEmail(user[0].email, newPassword);

    return res.json({
      success: true,
      message: "Password reset successfully by admin",
      code: "ADMIN_PASSWORD_RESET",
    });
  } catch (err) {
    console.error("Admin reset password error:", err);
    res.status(500).json({
      error: "Admin reset failed",
      code: "RESET_FAILED",
    });
  }
};


// Mendapatkan saldo user
exports.getUserBalance = async (req, res) => {
  const user_id = req.user.id;

  try {
    const [user] = await db.query(
      `SELECT balance FROM users WHERE id = ?`,
      [user_id]
    );

    if (!user.length) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json({
      success: true,
      balance: user[0].balance,
    });
  } catch (err) {
    console.error("Get user balance error:", err);
    res.status(500).json({
      error: "Failed to get user balance",
      details: process.env.NODE_ENV === "development" ? err.message : null,
    });
  }
};