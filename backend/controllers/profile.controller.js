const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { logActivity } = require('../services/auditService');

// Helper: Validasi input update
const validateUpdateInput = (data, isAdmin) => {
  const allowedFieldsForUser = [
    'name', 
    'username', 
    'whatsapp_number',
    'usdt_network',
    'usdt_address'
  ];
  
  const allowedFieldsForAdmin = [
    ...allowedFieldsForUser,
    'role',
    'email',
    'is_active'
  ];

  const allowedFields = isAdmin ? allowedFieldsForAdmin : allowedFieldsForUser;
  const errors = [];

  // Filter field yang diizinkan
  const filteredData = {};
  Object.keys(data).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredData[key] = data[key];
    } else {
      errors.push(`Field '${key}' tidak diizinkan`);
    }
  });

  // Validasi khusus
  if (data.whatsapp_number && !/^\+?[0-9]{10,15}$/.test(data.whatsapp_number)) {
    errors.push('Format nomor WhatsApp tidak valid');
  }

  if (data.usdt_address && !data.usdt_network) {
    errors.push('USDT network harus disertakan jika address diisi');
  }

  return {
    valid: errors.length === 0,
    filteredData,
    errors
  };
};

// Get User Profile (READ)
exports.getProfile = async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const { id: requesterId, role: requesterRole } = req.user;

    // Authorization: Hanya admin atau user pemilik akun
    if (requesterRole !== 'admin' && requesterId.toString() !== targetUserId) {
      return res.status(403).json({
        success: false,
        error: 'Akses ditolak',
        code: 'ACCESS_DENIED'
      });
    }

    // Query database
    const [user] = await db.query(
      `SELECT 
        id, name, username, email,
        whatsapp_number, usdt_network, usdt_address,
        role, provider, is_active, created_at
       FROM users WHERE id = ?`,
      [targetUserId]
    );

    if (!user.length) {
      return res.status(404).json({
        success: false,
        error: 'User tidak ditemukan',
        code: 'USER_NOT_FOUND'
      });
    }

    // Audit log
    await logActivity({
      userId: requesterId,
      action: 'VIEW_PROFILE',
      targetId: targetUserId,
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      data: user[0]
    });

  } catch (err) {
    console.error('[GET PROFILE ERROR]', err);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil profil',
      code: 'SERVER_ERROR'
    });
  }
};

// Update Profile (UPDATE)
exports.updateProfile = async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const { id: requesterId, role: requesterRole } = req.user;
    const isAdmin = requesterRole === 'admin';

    // Authorization
    if (!isAdmin && requesterId.toString() !== targetUserId) {
      return res.status(403).json({
        success: false,
        error: 'Akses ditolak',
        code: 'ACCESS_DENIED'
      });
    }

    // Validasi input
    const validation = validateUpdateInput(req.body, isAdmin);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors,
        code: 'INVALID_INPUT'
      });
    }

    // Jika update username/email, cek duplikat
    if (validation.filteredData.username || validation.filteredData.email) {
      const [existing] = await db.query(
        `SELECT id FROM users 
         WHERE (username = ? OR email = ?) AND id != ?`,
        [
          validation.filteredData.username,
          validation.filteredData.email,
          targetUserId
        ]
      );

      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Username/email sudah digunakan',
          code: 'DUPLICATE_ENTRY'
        });
      }
    }

    // Update database
    await db.query(
      'UPDATE users SET ? WHERE id = ?',
      [validation.filteredData, targetUserId]
    );

    // Dapatkan data terbaru
    const [updatedUser] = await db.query(
      `SELECT 
        id, name, username, email,
        whatsapp_number, role, is_active
       FROM users WHERE id = ?`,
      [targetUserId]
    );

    // Audit log
    await logActivity({
      userId: requesterId,
      action: 'UPDATE_PROFILE',
      targetId: targetUserId,
      metadata: {
        changes: validation.filteredData,
        ip: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      data: updatedUser[0]
    });

  } catch (err) {
    console.error('[UPDATE PROFILE ERROR]', err);
    
    // Handle database errors
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'Data sudah digunakan user lain',
        code: 'DUPLICATE_DATA'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Gagal memperbarui profil',
      code: 'SERVER_ERROR'
    });
  }
};

// Deactivate Account (SOFT DELETE)
exports.deactivateAccount = async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const { id: requesterId, role: requesterRole } = req.user;

    // Authorization: Hanya admin atau user sendiri
    if (requesterRole !== 'admin' && requesterId.toString() !== targetUserId) {
      return res.status(403).json({
        success: false,
        error: 'Akses ditolak',
        code: 'ACCESS_DENIED'
      });
    }

    // Soft delete (jangan hapus dari database)
    await db.query(
      `UPDATE users SET 
        is_active = 0,
        deleted_at = NOW(),
        reset_token = NULL
       WHERE id = ?`,
      [targetUserId]
    );

    // Audit log
    await logActivity({
      userId: requesterId,
      action: 'DEACTIVATE_ACCOUNT',
      targetId: targetUserId,
      metadata: {
        ip: req.ip,
        deletedAt: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      message: 'Akun berhasil dinonaktifkan'
    });

  } catch (err) {
    console.error('[DEACTIVATE ACCOUNT ERROR]', err);
    res.status(500).json({
      success: false,
      error: 'Gagal menonaktifkan akun',
      code: 'SERVER_ERROR'
    });
  }
};