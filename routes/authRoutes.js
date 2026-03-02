const express = require('express');
const router = express.Router();
const multer = require('multer');
const { register, login, getAllUsers } = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', upload.single('profile_image'), register);
router.post('/login', login);
router.get('/users', authenticate, getAllUsers);

module.exports = router;