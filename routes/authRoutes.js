const express = require('express');
const router = express.Router();
const multer = require('multer');
const { register, login } = require('../controllers/authController');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', upload.single('profile_image'), register);
router.post('/login', login);

module.exports = router;