const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const imagekit = require('../services/imagekitService');
require('dotenv').config();

// REGISTER
const register = async (req, res) => {
  try {
    const { fullname, email, phone_no, password, village, city } = req.body;

    if (!fullname || !password || (!email && !phone_no)) {
      return res.status(400).json({ message: 'fullname, password, and email or phone_no are required' });
    }
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? OR phone_no = ?',
      [email || null, phone_no || null]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'User already exists with this email or phone' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let profile_image_url = null;
    let profile_image_id = null;

    if (req.file) {
      const uploadResponse = await imagekit.upload({
        file: req.file.buffer.toString('base64'),
        fileName: `${phone_no || email}_${Date.now()}`,
        folder: '/babariya-parivar/profile-images',
      });
      profile_image_url = uploadResponse.url;
      profile_image_id = uploadResponse.fileId;
    }

    await db.query(
      'INSERT INTO users (fullname, email, phone_no, password, village, city, profile_image_url, profile_image_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [fullname, email || null, phone_no || null, hashedPassword, village || null, city || null, profile_image_url, profile_image_id]
    );

    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ message: 'login and password are required' });
    }

    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ? OR phone_no = ?',
      [login, login]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        phone_no: user.phone_no,
        village: user.village,
        city: user.city,
        profile_image_url: user.profile_image_url,
        profile_image_id: user.profile_image_id,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET ALL USERS
const getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, fullname, email, phone_no, village, city, profile_image_url FROM users ORDER BY created_at DESC'
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

// GET OWN PROFILE
const getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, fullname, email, phone_no, village, city, profile_image_url, profile_image_id, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile fetched successfully',
      user: rows[0],
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// CHANGE PASSWORD (logged in user with old password)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const user = rows[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { register, login, getAllUsers, getProfile, changePassword };
