const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const registerAdmin = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
      return res.status(400).json({ message: 'fullname, email and password are required' });
    }

    const [existing] = await db.query('SELECT id FROM admins WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Admin already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO admins (fullname, email, password) VALUES (?, ?, ?)',
      [fullname, email, hashedPassword]
    );

    const token = jwt.sign(
      { id: result.insertId, email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Admin registered successfully',
      token
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const [rows] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Admin login successful',
      token
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { registerAdmin, loginAdmin };
