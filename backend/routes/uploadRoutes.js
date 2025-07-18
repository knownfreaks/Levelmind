// backend/routes/uploadRoutes.js
const express = require('express');
const {
  uploadProfileImage,
  uploadResume,
  uploadCertificate
} = require('../config/multer'); // Import multer instances

const authMiddleware = require('../middleware/authMiddleware'); // Assuming uploads require authentication
const authorizeRoles = require('../middleware/roleMiddleware'); // Assuming uploads might have role restrictions

const router = express.Router();

// --- Middleware for all upload routes (authentication) ---
router.use(authMiddleware);

// @desc    Upload a profile image
// @route   POST /api/upload/profile-image
// @access  Student, School (authenticated users)
router.post('/profile-image', authorizeRoles('student', 'school', 'admin'), uploadProfileImage.single('image'), (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file uploaded.' });
  }
  // Return the relative path. Frontend will prepend STATIC_FILES_BASE_URL.
  res.status(200).json({
    success: true,
    message: 'Profile image uploaded successfully.',
    data: {
      filePath: `/uploads/profiles/${req.file.filename}` // Relative path on server
    }
  });
});

// @desc    Upload a resume
// @route   POST /api/upload/resume
// @access  Student
router.post('/resume', authorizeRoles('student'), uploadResume.single('resume'), (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No resume file uploaded.' });
  }
  res.status(200).json({
    success: true,
    message: 'Resume uploaded successfully.',
    data: {
      filePath: `/uploads/resumes/${req.file.filename}` // Relative path on server
    }
  });
});

// @desc    Upload a certificate
// @route   POST /api/upload/certificate
// @access  Student
router.post('/certificate', authorizeRoles('student'), uploadCertificate.single('certificate'), (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No certificate file uploaded.' });
  }
  res.status(200).json({
    success: true,
    message: 'Certificate uploaded successfully.',
    data: {
      filePath: `/uploads/certificates/${req.file.filename}` // Relative path on server
    }
  });
});

module.exports = router;
