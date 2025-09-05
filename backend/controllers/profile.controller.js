const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { logActivity } = require('../services/auditService');

// Helper: Validasi input update (Enhanced)
const validateUpdateInput = (data, isAdmin) => {
  const allowedFieldsForUser = [
    'name', 
    'username', 
    'whatsapp_number',
    'usdt_network',
    'usdt_address',
    'profile_image' // Tambahan untuk fitur dashboard
  ];
  
  const allowedFieldsForAdmin = [
    ...allowedFieldsForUser,
    'role',
    'email',
    'is_active',
    'verified_at'
  ];

  const allowedFields = isAdmin ? allowedFieldsForAdmin : allowedFieldsForUser;
  const errors = [];
  const warnings = [];

  // Filter field yang diizinkan
  const filteredData = {};
  Object.keys(data).forEach(key => {
    if (allowedFields.includes(key)) {
      // Validasi khusus sebelum dimasukkan ke filteredData
      if (key === 'whatsapp_number' && data[key] && !/^\+?[0-9]{10,15}$/.test(data[key])) {
        errors.push(`Format nomor WhatsApp tidak valid`);
        return;
      }
      
      if (key === 'usdt_address' && data[key] && !data['usdt_network']) {
        errors.push(`USDT network harus disertakan jika address diisi`);
        return;
      }

      filteredData[key] = data[key];
    } else {
      warnings.push(`Field '${key}' tidak diizinkan dan akan diabaikan`);
    }
  });

  return {
    valid: errors.length === 0,
    filteredData,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
};

// Get User Profile (Enhanced for Dashboard)
exports.getProfile = async (req, res) => {
  try {
    const { id: targetUserId } = req.params || {};
    const { id: requesterId, role: requesterRole } = req.user;

    const profileId = targetUserId || requesterId;

    if (requesterRole !== 'admin' && requesterId.toString() !== profileId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Akses ditolak',
        code: 'ACCESS_DENIED'
      });
    }

    // Query yang sudah dikoreksi
    const [user] = await db.query(
      `SELECT 
        u.id, u.name, u.username, u.email,
        u.whatsapp_number, u.usdt_network, u.usdt_address,
        u.role, u.provider, u.is_active, u.profile_image,
        u.created_at, u.updated_at,
        (SELECT COUNT(*) FROM referrals WHERE referrer_id = u.id) as referral_count,
        (SELECT COUNT(*) FROM deposits WHERE user_id = u.id AND status = 'completed') as completed_deposits,
        (SELECT COUNT(*) FROM notifications WHERE recipient_id = u.id AND is_read = 0) as unread_notifications
       FROM users u WHERE u.id = ?`,
      [profileId]
    );

    if (!user.length) {
      return res.status(404).json({
        success: false,
        error: 'User tidak ditemukan',
        code: 'USER_NOT_FOUND'
      });
    }

    const profileData = {
      ...user[0],
      stats: {
        referrals: user[0].referral_count || 0,
        deposits: user[0].completed_deposits || 0,
        unread_notifications: user[0].unread_notifications || 0
      }
    };
    
    // Cleanup
    ['referral_count', 'completed_deposits', 'unread_notifications'].forEach(f => delete profileData[f]);

    await logActivity({
      userId: requesterId,
      action: 'VIEW_PROFILE',
      targetId: profileId,
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      data: profileData
    });

  } catch (err) {
    console.error('[GET PROFILE ERROR]', err);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil profil',
      code: 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? {
        message: err.message,
        stack: err.stack,
        sqlError: err.sqlMessage
      } : undefined
    });
  }
};

// profile.controller.js - Perbaikan fungsi updateProfile untuk handle FormData
exports.updateProfile = async (req, res) => {
  try {
    const { id: userId } = req.user;
    
    // Prepare update data
    const updateData = {
      updated_at: new Date()
    };

    // Handle fields from FormData
    console.log('Request body:', req.body); // Debugging
    console.log('Request file:', req.file); // Debugging

    if (req.body.name) updateData.name = req.body.name;
    if (req.body.username) updateData.username = req.body.username;
    if (req.body.whatsapp_number !== undefined) updateData.whatsapp_number = req.body.whatsapp_number;
    if (req.body.usdt_network) updateData.usdt_network = req.body.usdt_network;
    if (req.body.usdt_address !== undefined) updateData.usdt_address = req.body.usdt_address;
    
    // Handle profile image upload
if (req.file) {
  updateData.profile_image = `/uploads/profiles/${req.file.filename}`;
} else if (req.body.profile_image === null || req.body.profile_image === '') {
  // Hapus foto profil
  updateData.profile_image = null;  // Menghapus gambar dari database
}

    // Validate at least one field is being updated
    if (Object.keys(updateData).length <= 1 && !req.file) {
      return res.status(400).json({
        success: false,
        error: 'At least one field must be updated',
        code: 'NO_FIELDS_TO_UPDATE'
      });
    }

    // Validate username uniqueness
    if (updateData.username) {
      const [existing] = await db.query(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [updateData.username, userId]
      );
      
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Username already taken',
          code: 'USERNAME_EXISTS'
        });
      }
    }

    // Build and execute query
    const setClause = Object.keys(updateData)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.values(updateData);
    values.push(userId);

    console.log('Update query:', `UPDATE users SET ${setClause} WHERE id = ?`); // Debugging
    console.log('Update values:', values); // Debugging

    await db.query(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      values
    );

    // Get updated user data
    const [updatedUser] = await db.query(
      'SELECT id, name, username, email, profile_image, whatsapp_number, usdt_network, usdt_address FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser[0]
    });

  } catch (err) {
    console.error('[UPDATE PROFILE ERROR]', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      code: 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? {
        message: err.message,
        sql: err.sql,
        stack: err.stack
      } : undefined
    });
  }
};

// Deactivate Account (Enhanced)
exports.deactivateAccount = async (req, res) => {
  try {
    const { id: targetUserId } = req.params || {};
    const { id: requesterId, role: requesterRole } = req.user;
    const isAdmin = requesterRole === 'admin';

    // Jika tidak ada params, deactivate diri sendiri
    const profileId = targetUserId || requesterId;

    // Authorization: Hanya admin atau user sendiri
    if (!isAdmin && requesterId.toString() !== profileId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Akses ditolak',
        code: 'ACCESS_DENIED'
      });
    }

    // Dapatkan data sebelum diupdate untuk log
    const [userBefore] = await db.query(
      `SELECT username, email FROM users WHERE id = ?`,
      [profileId]
    );

    // Soft delete (jangan hapus dari database)
    await db.query(
      `UPDATE users SET 
        is_active = 0,
        deleted_at = NOW(),
        reset_token = NULL,
        updated_at = NOW()
       WHERE id = ?`,
      [profileId]
    );

    // Audit log
    await logActivity({
      userId: requesterId,
      action: 'DEACTIVATE_ACCOUNT',
      targetId: profileId,
      metadata: {
        ip: req.ip,
        deletedAt: new Date().toISOString(),
        previousData: userBefore[0]
      }
    });

    // Response untuk dashboard
    res.json({
      success: true,
      message: 'Akun berhasil dinonaktifkan',
      deactivated_at: new Date().toISOString()
    });

  } catch (err) {
    console.error('[DEACTIVATE ACCOUNT ERROR]', err);
    res.status(500).json({
      success: false,
      error: 'Gagal menonaktifkan akun',
      code: 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get Profile Summary for Dashboard
exports.getProfileSummary = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const [results] = await db.query(
      `SELECT 
        (SELECT COUNT(*) FROM referrals WHERE referrer_id = ?) AS referral_count,
        (SELECT COUNT(*) FROM deposits WHERE user_id = ? AND status = 'approved') AS deposit_count,
        (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE user_id = ?) AS total_commission,
        (SELECT COUNT(*) FROM notifications WHERE recipient_id = ? AND is_read = 0) AS unread_notifications`,
      [userId, userId, userId, userId]
    );

    res.json({
      success: true,
      data: results[0]
    });

  } catch (err) {
    console.error('[PROFILE SUMMARY ERROR]', err);
    res.status(500).json({
      success: false,
      error: 'Failed to get summary data',
      code: 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? {
        message: err.message,
        sql: err.sql
      } : undefined
    });
  }
};


exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;  // Ambil ID user dari token JWT

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required." });
    }

    // Verifikasi password lama
    const user = await User.findById(userId);
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect current password" });
    }

    // Hash password baru dan simpan
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error('Error while changing password:', err);
    res.status(500).json({ error: "Internal server error" });
  }
};


// Get User Stats (for Dashboard Card User)
exports.getUserStats = async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE is_active = 1) AS registered,
        (SELECT COUNT(*) FROM users WHERE is_active = 0) AS failed
    `);

    res.json({
      success: true,
      data: results[0]
    });
  } catch (err) {
    console.error('[GET USER STATS ERROR]', err);
    res.status(500).json({
      success: false,
      error: 'Failed to get user stats',
      code: 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? {
        message: err.message,
        sql: err.sql
      } : undefined
    });
  }
};



