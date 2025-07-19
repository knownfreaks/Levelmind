// routes/schoolRoutes.js
const express = require('express');
const {
  getSchoolDashboardMetrics,
  getRecentJobPostings,
  createJobPost,
  getSchoolJobs,
  getJobDetails, // This endpoint can be used by School/Student/Public to view job details
  updateJobStatus,
  getJobApplicants,
  updateApplicationStatus,
  scheduleInterview,
  getSchoolProfile,
  getApplicantDetails // This endpoint used by School to view applicant details
} = require('../controllers/schoolController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const { validate, jobSchemas } = require('../middleware/validationMiddleware');
const Joi = require('joi');

const router = express.Router();

// Apply auth and role middleware to all school-specific routes
router.use(authMiddleware);
router.use(authorizeRoles('school')); // All routes in this file require 'school' role

//Application Management
router.patch('/applications/:id/status', updateApplicationStatus);
router.post('/applications/:id/schedule', validate(Joi.object({
  title: Joi.string().min(3).required(),
  date: Joi.string().required(), // <--- MODIFIED: Accepts date as a string
  startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(), // HH:MM format
  endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
})), scheduleInterview);

// Dashboard
router.get('/dashboard-metrics', getSchoolDashboardMetrics);
router.get('/recent-job-postings', getRecentJobPostings);

// Job Postings (for the school's own jobs)
router.post('/jobs', validate(jobSchemas.createJob), createJobPost);
router.get('/jobs', getSchoolJobs); // Get all jobs posted by the school
router.get('/jobs/:id', getJobDetails); // Get details of a specific job (could be public, but here restricted to school context for now)
router.patch('/jobs/:id/status', validate(jobSchemas.updateJobStatus), updateJobStatus);

// Applicant Management for a specific job
router.get('/jobs/:id/applicants', getJobApplicants); // Get all applicants for a specific job
router.get('/applicants/:id', getApplicantDetails); // Get full details of a specific applicant

// Application Status & Interview Scheduling
router.patch('/applications/:id/status', validate(jobSchemas.updateApplicationStatus), updateApplicationStatus);
router.post('/applications/:id/schedule', validate(jobSchemas.scheduleInterview), scheduleInterview);
router.get('/profile', getSchoolProfile); // Get the school's profile information

module.exports = router;