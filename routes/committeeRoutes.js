const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../middlewares/authMiddleware'); 
const { registerMember, loginMember, getAllMembers } = require('../controllers/committeeController');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', upload.single('profile_image'), registerMember);
router.post('/login', loginMember);
router.get('/members',authenticate, getAllMembers);

module.exports = router;