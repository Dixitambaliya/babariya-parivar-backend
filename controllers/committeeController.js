const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const imagekit = require('../services/imagekitService');
require('dotenv').config();

// REGISTER
const registerMember = async (req, res) => {
  try {
    const { fullname, email, phone_no, password, village, city } = req.body;

    if (!fullname || !password || (!email && !phone_no)) {
      return res.status(400).json({ message: 'fullname, password, and email or phone_no are required' });
    }

    if (!req.file) {
        return res.status(400).json({ message: 'Profile image is required' });
    }   
    const [existing] = await db.query(
      'SELECT id FROM committee_members WHERE email = ? OR phone_no = ?',
      [email || null, phone_no || null]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Member already exists with this email or phone' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let profile_image_url = null;
    let profile_image_id = null;

    if (req.file) {
      const uploadResponse = await imagekit.upload({
        file: req.file.buffer.toString('base64'),
        fileName: `committee_${phone_no || email}_${Date.now()}`,
        folder: '/babariya-parivar/committee-profile-images',
      });
      profile_image_url = uploadResponse.url;
      profile_image_id = uploadResponse.fileId;
    }

    await db.query(
      'INSERT INTO committee_members (fullname, email, phone_no, password, village, city, profile_image_url, profile_image_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [fullname, email || null, phone_no || null, hashedPassword, village || null, city || null, profile_image_url, profile_image_id]
    );

    res.status(201).json({ message: 'Committee member registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// LOGIN
const loginMember = async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ message: 'login and password are required' });
    }

    const [members] = await db.query(
      'SELECT * FROM committee_members WHERE email = ? OR phone_no = ?',
      [login, login]
    );

    if (members.length === 0) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const member = members[0];
    const isMatch = await bcrypt.compare(password, member.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: member.id, email: member.email, role: 'committee' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      member: {
        id: member.id,
        fullname: member.fullname,
        email: member.email,
        phone_no: member.phone_no,
        village: member.village,
        city: member.city,
        profile_image_url: member.profile_image_url,
        profile_image_id: member.profile_image_id,
        created_at: member.created_at,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET ALL MEMBERS
const getAllMembers = async (req, res) => {
  try {
    const [members] = await db.query(
      'SELECT id, fullname, email, phone_no, village, city, profile_image_url, profile_image_id, created_at FROM committee_members ORDER BY created_at DESC'
    );

    const [users] = await db.query(
      'SELECT id, fullname, email, phone_no, village, city, profile_image_url, profile_image_id, created_at FROM users ORDER BY created_at DESC'
    );

    res.status(200).json({
      message: 'Data fetched successfully',
      committee_members: {
        total: members.length,
        data: members,
      },
      users: {
        total: users.length,
        data: users,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { registerMember, loginMember, getAllMembers };