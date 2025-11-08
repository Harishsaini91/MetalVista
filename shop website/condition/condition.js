
const multer = require("multer");
const path = require("path");


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Set destination directory for uploaded files
    cb(null, './public/images/uploded_image/'); // Directory to store images and videos
  },
  filename: (req, file, cb) => {
    // Generate unique filenames
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// File filter to allow only specific file types (images and videos)
const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png|gif|mp4|mkv|avi|mov/; // Allowed extensions
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = fileTypes.test(file.mimetype);

  if (extname && mimeType) {
    cb(null, true);
  } else {
    cb(new Error('Only images and video files are allowed!'));
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // Limit file size to 100 MB
    files: 20 // Limit the number of files to 20
  },
  fileFilter: fileFilter
});

// 
const roleCheck = (role) => {
  return (req, res, next) => {
  const userRole = req.session.userRole || null;

    // Assuming user role is stored in `req.user` after authentication (e.g., JWT or session-based)
    if (userRole && userRole === role) {
      return next();
    } else {
      return res.status(403).json({ message: 'Access Denied: Admins only' });
    }
  };
};

  // middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');


const authenticate = (req, res, next) => {
  if (req.session && req.session.userId) {
    // You can attach user info to req.user for convenience
    req.user = {
      _id: req.session.userId,
      role: req.session.userRole,
      gmail: req.session.gmail
    }; 
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
};


const isAdmin=(req, res, next)=> {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).send("Access denied");
  }
}



module.exports = {
  upload,
  roleCheck,
  authenticate,
  isAdmin
};