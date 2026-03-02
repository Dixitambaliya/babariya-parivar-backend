const imagekit = require('../services/imagekitService');

// UPLOAD IMAGE
const uploadImage = async (req, res) => {
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
      message: 'Image uploaded successfully',
      gallery: {
        image_id: uploadResponse.fileId,
        image_url: uploadResponse.url,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET ALL IMAGES FROM IMAGEKIT
const getAllImages = async (req, res) => {
  try {
    const files = await imagekit.listFiles({
      path: '/babariya-parivar/gallery',
    });

    res.status(200).json({
      message: 'Gallery fetched successfully',
      total: files.length,
      gallery: files.map((file) => ({
        image_id: file.fileId,
        image_url: file.url,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET BY IMAGE ID FROM IMAGEKIT
const getImageById = async (req, res) => {
  try {
    const file = await imagekit.getFileDetails(req.params.id);

    res.status(200).json({
      message: 'Image fetched successfully',
      gallery: {
        image_id: file.fileId,
        image_url: file.url,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Image not found', error: err.message });
  }
};

// DELETE IMAGE FROM IMAGEKIT
const deleteImage = async (req, res) => {
  try {
    await imagekit.deleteFile(req.params.id);
    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { uploadImage, getAllImages, getImageById, deleteImage };