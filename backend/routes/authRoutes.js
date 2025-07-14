// routes/authRoutes.js
const express = require('express');
const {
  loginUser,
  registerStudent,
  registerSchool,
  completeOnboarding,
  logoutUser
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const { validate, authSchemas, validateOnboarding } = require('../middleware/validationMiddleware');
const { uploadProfileImage } = require('../config/multer'); // Multer config for file uploads

const router = express.Router();

// Public routes
router.post('/login', validate(authSchemas.login), loginUser);

// Admin-only registration routes
router.post('/register/student', authMiddleware, authorizeRoles('admin'), validate(authSchemas.adminRegister), registerStudent);
router.post('/register/school', authMiddleware, authorizeRoles('admin'), validate(authSchemas.adminRegister), registerSchool);

// Onboarding route (Auth required, for student/school)
router.post(
  '/complete-onboarding',
  authMiddleware, // Ensures user is logged in
  authorizeRoles('student', 'school'), // Only students and schools can onboard
  // Multer middleware: 'image' is the field name for the uploaded file in the form-data
  uploadProfileImage.single('image'),
  validateOnboarding, // Custom validation for multipart form data
  completeOnboarding
);

// Logout route (Auth required)
router.post('/logout', authMiddleware, logoutUser);

module.exports = router;