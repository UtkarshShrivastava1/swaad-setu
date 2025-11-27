const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Critical Multi-Tenant Logic: Use req.params.rid for dynamic folder path
    const folderPath = `swaad-setu/menus/${req.params.rid}`;
    return {
      folder: folderPath,
      format: ['jpg', 'png', 'jpeg', 'webp'].includes(file.mimetype.split('/')[1]) ? file.mimetype.split('/')[1] : 'jpeg', // Fallback to jpeg if format not explicitly allowed
      public_id: file.originalname.split('.')[0], // Use original name as public_id
      transformation: [{ width: 500, height: 500, crop: 'limit' }] // Optimization
    };
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, JPG, and WEBP are allowed.'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  }
});

module.exports = upload;
