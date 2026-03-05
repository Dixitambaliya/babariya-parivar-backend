const bcrypt = require('bcryptjs');
const db = require('../config/db');
const imagekit = require('../services/imagekitService');

const getAllUsersAdmin = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, fullname, email, phone_no, village, city, profile_image_url, profile_image_id, created_at FROM users ORDER BY created_at DESC'
    );

    res.status(200).json({
      message: 'Users fetched successfully',
      total: rows.length,
      users: rows,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const editUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const { fullname, email, phone_no, village, city, password } = req.body;

    const [existingRows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (existingRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingUser = existingRows[0];
    const updates = [];
    const values = [];

    if (fullname !== undefined) {
      updates.push('fullname = ?');
      values.push(fullname);
    }

    if (village !== undefined) {
      updates.push('village = ?');
      values.push(village || null);
    }

    if (city !== undefined) {
      updates.push('city = ?');
      values.push(city || null);
    }

    if (email !== undefined) {
      const normalizedEmail = email || null;
      if (normalizedEmail) {
        const [emailExists] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [normalizedEmail, userId]);
        if (emailExists.length > 0) {
          return res.status(409).json({ message: 'Email already in use by another user' });
        }
      }
      updates.push('email = ?');
      values.push(normalizedEmail);
    }

    if (phone_no !== undefined) {
      const normalizedPhone = phone_no || null;
      if (normalizedPhone) {
        const [phoneExists] = await db.query('SELECT id FROM users WHERE phone_no = ? AND id != ?', [normalizedPhone, userId]);
        if (phoneExists.length > 0) {
          return res.status(409).json({ message: 'Phone number already in use by another user' });
        }
      }
      updates.push('phone_no = ?');
      values.push(normalizedPhone);
    }

    if (password !== undefined) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      values.push(hashedPassword);
    }

    if (req.file) {
      const uploadResponse = await imagekit.upload({
        file: req.file.buffer.toString('base64'),
        fileName: `${phone_no || existingUser.phone_no || email || existingUser.email || 'user'}_${Date.now()}`,
        folder: '/babariya-parivar/profile-images',
      });

      if (existingUser.profile_image_id) {
        try {
          await imagekit.deleteFile(existingUser.profile_image_id);
        } catch (deleteErr) {
          // Ignore delete error to avoid blocking update if old file is already missing.
        }
      }

      updates.push('profile_image_url = ?');
      values.push(uploadResponse.url);
      updates.push('profile_image_id = ?');
      values.push(uploadResponse.fileId);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields provided for update' });
    }

    values.push(userId);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    const [updatedRows] = await db.query(
      'SELECT id, fullname, email, phone_no, village, city, profile_image_url, profile_image_id, created_at FROM users WHERE id = ?',
      [userId]
    );

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedRows[0],
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const [rows] = await db.query(
      'SELECT id, fullname, profile_image_id FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];
    await db.query('DELETE FROM users WHERE id = ?', [userId]);

    if (user.profile_image_id) {
      try {
        await imagekit.deleteFile(user.profile_image_id);
      } catch (deleteErr) {
        // Ignore delete error to keep user deletion successful.
      }
    }

    res.status(200).json({
      message: 'User deleted successfully',
      user: { id: user.id, fullname: user.fullname },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const promoteUserToCommittee = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const userId = req.params.id;
    await connection.beginTransaction();

    const [userRows] = await connection.query('SELECT * FROM users WHERE id = ? FOR UPDATE', [userId]);
    if (userRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userRows[0];
    const duplicateChecks = [];
    const duplicateValues = [];

    if (user.email) {
      duplicateChecks.push('email = ?');
      duplicateValues.push(user.email);
    }
    if (user.phone_no) {
      duplicateChecks.push('phone_no = ?');
      duplicateValues.push(user.phone_no);
    }

    if (duplicateChecks.length > 0) {
      const [duplicates] = await connection.query(
        `SELECT id FROM committee_members WHERE ${duplicateChecks.join(' OR ')} LIMIT 1`,
        duplicateValues
      );

      if (duplicates.length > 0) {
        await connection.rollback();
        return res.status(409).json({ message: 'User already exists in committee members' });
      }
    }

    await connection.query(
      'INSERT INTO committee_members (fullname, email, phone_no, password, village, city, profile_image_url, profile_image_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        user.fullname,
        user.email || null,
        user.phone_no || null,
        user.password,
        user.village || null,
        user.city || null,
        user.profile_image_url || null,
        user.profile_image_id || null,
      ]
    );

    await connection.query('DELETE FROM users WHERE id = ?', [userId]);
    await connection.commit();

    res.status(200).json({
      message: 'User moved to committee members successfully',
      member: {
        fullname: user.fullname,
        email: user.email,
        phone_no: user.phone_no,
      },
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    connection.release();
  }
};

const addGalleryImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    const uploadResponse = await imagekit.upload({
      file: req.file.buffer.toString('base64'),
      fileName: `gallery_${Date.now()}`,
      folder: '/babariya-parivar/gallery',
    });

    res.status(201).json({
      message: 'Gallery image added successfully',
      gallery: {
        image_id: uploadResponse.fileId,
        image_url: uploadResponse.url,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const editGalleryImage = async (req, res) => {
  try {
    const oldImageId = req.params.id;
    if (!req.file) {
      return res.status(400).json({ message: 'New image file is required' });
    }

    const uploadResponse = await imagekit.upload({
      file: req.file.buffer.toString('base64'),
      fileName: `gallery_${Date.now()}`,
      folder: '/babariya-parivar/gallery',
    });

    try {
      await imagekit.deleteFile(oldImageId);
    } catch (deleteErr) {
      // Keep successful replacement response even if old image deletion fails.
    }

    res.status(200).json({
      message: 'Gallery image updated successfully',
      gallery: {
        old_image_id: oldImageId,
        image_id: uploadResponse.fileId,
        image_url: uploadResponse.url,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteGalleryImage = async (req, res) => {
  try {
    await imagekit.deleteFile(req.params.id);
    res.status(200).json({ message: 'Gallery image deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  getAllUsersAdmin,
  editUserById,
  deleteUserById,
  promoteUserToCommittee,
  addGalleryImage,
  editGalleryImage,
  deleteGalleryImage,
};
