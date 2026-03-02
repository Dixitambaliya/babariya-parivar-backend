const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../middlewares/authMiddleware');
const { uploadImage, getAllImages, getImageById, deleteImage } = require('../controllers/galleryController');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', authenticate, upload.single('image'), uploadImage);
router.get('/', getAllImages);
router.get('/:id', getImageById);
router.delete('/:id', authenticate, deleteImage);

module.exports = router;