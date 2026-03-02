const express = require('express');
const router = express.Router();
const multer = require('multer');
const { register, login, getAllUsers,getProfile,changePassword,forgotPassword,verifyOtp,resetPassword } = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', upload.single('profile_image'), register);
router.post('/login', login);
router.get('/users', authenticate, getAllUsers);
router.get('/profile', authenticate, getProfile);
router.post('/change-password', authenticate, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);


module.exports = router;