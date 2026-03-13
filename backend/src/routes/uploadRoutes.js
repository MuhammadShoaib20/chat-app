const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { storage, hasCloudinary } = require('../config/cloudinary');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ✅ Upload folder create کریں اگر موجود نہیں ہے
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ Local storage کے لیے
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// ✅ Multer configuration
const upload = multer({
  storage: hasCloudinary ? storage : localStorage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // ✅ فائل type کو validate کریں
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// ✅ Upload endpoint - POST /api/upload
router.post('/', protect, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer Error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          message: 'File size exceeds 10MB limit' 
        });
      }
      return res.status(400).json({ 
        message: err.message 
      });
    } else if (err) {
      console.error('Upload Error:', err);
      return res.status(400).json({ 
        message: err.message 
      });
    }
    next();
  });
}, (req, res) => {
  try {
    // ✅ File upload check کریں
    if (!req.file) {
      return res.status(400).json({ 
        message: 'No file uploaded' 
      });
    }

    // ✅ File URL بنائیں
    const url = hasCloudinary 
      ? req.file.path 
      : `/uploads/${req.file.filename}`;

    // ✅ Success response
    res.status(200).json({ 
      success: true,
      url: url,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('Route Error:', error);
    res.status(500).json({ 
      message: error.message || 'File upload failed' 
    });
  }
});

module.exports = router;