const express = require('express');
const multer = require('multer');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const { registerAdmin, loginAdmin } = require('../controllers/adminAuthController');
const {
  getAllUsersAdmin,
  editUserById,
  deleteUserById,
  promoteUserToCommittee,
  addGalleryImage,
  editGalleryImage,
  deleteGalleryImage,
} = require('../controllers/adminController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', registerAdmin);
router.post('/login', loginAdmin);

router.get('/users', authenticate, authorizeAdmin, getAllUsersAdmin);
router.put('/users/:id', authenticate, authorizeAdmin, upload.single('profile_image'), editUserById);
router.delete('/users/:id', authenticate, authorizeAdmin, deleteUserById);
router.post('/users/:id/make-committee-member', authenticate, authorizeAdmin, promoteUserToCommittee);

router.post('/gallery', authenticate, authorizeAdmin, upload.single('image'), addGalleryImage);
router.put('/gallery/:id', authenticate, authorizeAdmin, upload.single('image'), editGalleryImage);
router.delete('/gallery/:id', authenticate, authorizeAdmin, deleteGalleryImage);

module.exports = router;
