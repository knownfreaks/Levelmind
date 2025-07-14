// routes/studentRoutes.js
const express = require('express');
const {
  getStudentDashboard,
  getAvailableJobs,
  applyForJob,
  getStudentCalendar,
  getStudentProfile,
  updateStudentProfile
} = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const { validate, studentSchemas } = require('../middleware/validationMiddleware');
const { uploadResume, uploadProfileImage } = require('../config/multer'); // Import multer configs

const router = express.Router();

// Apply auth and role middleware to all student-specific routes
router.use(authMiddleware);
router.use(authorizeRoles('student')); // All routes in this file require 'student' role

// Dashboard
router.get('/dashboard', getStudentDashboard);

// Job Opportunities
router.get('/jobs', getAvailableJobs);
// Note: Frontend has POST /api/jobs/:id/apply which applies for a job
// The frontend form sends basic personal info + cover letter + file.
router.post('/jobs/:id/apply', uploadResume.single('file'), validate(studentSchemas.applyForJob), applyForJob);

// Calendar (Interviews)
router.get('/calendar', getStudentCalendar);

// Profile Management
router.get('/profile', getStudentProfile);
// Profile update can include file upload for profile image
router.patch('/profile', uploadProfileImage.single('image'), validate(studentSchemas.updateProfile), updateStudentProfile);


module.exports = router;