const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { storage, hasCloudinary } = require('../config/cloudinary');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Folder path check
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({
  storage: hasCloudinary ? storage : localStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

router.post('/', protect, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer Error:', err);
      return res.status(500).json({ message: err.message });
    }
    next();
  });
}, (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const url = hasCloudinary ? req.file.path : `/uploads/${req.file.filename}`;
    res.json({ url, originalName: req.file.originalname });
  } catch (error) {
    console.error('Route Error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;