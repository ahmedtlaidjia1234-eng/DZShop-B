import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { verifyAdmin } from '../middleware/auth.js';
import { isCloudinaryConfigured, uploadToCloudinary } from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) { 
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration (temporarily stores file on disk)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${safeName}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif|svg/;
    const extMatch = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeMatch = allowedTypes.test(file.mimetype);

    if (extMatch || mimeMatch) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPG, PNG, WEBP, GIF, SVG) are allowed.'));
  },
});

// Upload Image Endpoint (Cloudinary with project-1 folder, or local fallback)
router.post('/', verifyAdmin, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image file uploaded.',
    });
  }

  const localFilePath = req.file.path;

  try {
    if (isCloudinaryConfigured) {
      // Upload to Cloudinary under folder 'project-1'
      const cloudResult = await uploadToCloudinary(localFilePath, {
        folder: process.env.CLOUDINARY_FOLDER || 'project-1',
      });

      // Remove temporary file from local storage
      fs.unlink(localFilePath, () => {});

      return res.json({
        success: true,
        message: 'Image uploaded to Cloudinary (project-1) successfully.',
        url: cloudResult.secure_url,
        publicId: cloudResult.public_id,
        provider: 'cloudinary',
      });
    }

    // Local storage fallback if Cloudinary credentials are not set in .env
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      message: 'Image uploaded to local storage (Cloudinary credentials not set in server/.env).',
      url: fileUrl,
      filename: req.file.filename,
      provider: 'local',
    });
  } catch (error) {
    console.error('Upload processing error:', error);
    // If Cloudinary failed, fallback to local URL
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      message: 'Cloudinary upload had an issue; fallback to local storage.',
      url: fileUrl,
      filename: req.file.filename,
      provider: 'local',
    });
  }
});

export default router;
