// C:\Users\rog\OneDrive\Documents\levelminds\Levelminds\backend\middleware\validationMiddleware.js

const Joi = require('joi');
const fs = require('fs');
const path = require('path');

// Helper function for general validation (JSON body)
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.context.key,
      message: detail.message.replace(/"/g, '') // Remove quotes around field names
    }));
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors } });
  }
  next();
};

// --- Joi Schemas for Auth ---
const authSchemas = {
  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email must be a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    })
  }),

  adminRegister: Joi.object({
    name: Joi.string().min(3).required(),
    email: Joi.string().email().required()
  }),

  studentOnboarding: Joi.object({
    firstName: Joi.string().min(1).required(), // <-- Corrected: firstName
    lastName: Joi.string().min(1).required(),   // <-- Corrected: lastName
    mobile: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
      'string.pattern.base': 'Mobile number must be 10 digits',
      'string.empty': 'Mobile number is required',
      'any.required': 'Mobile number is required'
    }),
    about: Joi.string().optional().allow(''),
    education: Joi.array().items(Joi.object({
      college_name: Joi.string().required(),
      university_name: Joi.string().optional().allow(''),
      course_name: Joi.string().required(),
      start_year: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
      end_year: Joi.number().integer().min(Joi.ref('start_year')).max(new Date().getFullYear() + 5).optional().allow(null),
      gpa: Joi.string().optional().allow('') // <-- THIS IS THE CRITICAL LINE
    })).optional(),
    certifications: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      issued_by: Joi.string().required(),
      description: Joi.string().optional().allow(''),
      date_received: Joi.date().iso().required(),
      has_expiry: Joi.boolean().required(),
      expiry_date: Joi.date().iso().allow(null).when('has_expiry', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
      certificate_link: Joi.string().uri().optional().allow('')
    })).optional(),
    skills: Joi.array().items(Joi.string().max(20)).max(12).optional().default([])
  }),

  schoolOnboarding: Joi.object({
    bio: Joi.string().optional().allow(''),
    website_link: Joi.string().uri().optional().allow(''),
    address: Joi.object({
      address: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      pincode: Joi.string().pattern(/^[0-9]{6}$/).required().messages({
        'string.pattern.base': 'Pincode must be 6 digits',
        'string.empty': 'Pincode is required',
        'any.required': 'Pincode is required'
      })
    }).required()
  })
};

// --- Joi Schemas for Jobs & Applications (School) ---
const jobSchemas = {
  createJob: Joi.object({
    title: Joi.string().min(1).required(),
    type: Joi.string().uuid().required(), // Category ID
    application_end_date: Joi.date().iso().min(new Date().toISOString().split('T')[0]).required().messages({
        'date.min': 'Application end date must be today or in the future',
        'date.iso': 'Application end date must be a valid ISO date (YYYY-MM-DD)'
    }),
    subjects: Joi.array().items(Joi.string().min(1)).optional().default([]),
    salary_min: Joi.number().min(0).required(),
    salary_max: Joi.number().min(Joi.ref('salary_min')).optional().allow(null),
    description: Joi.string().min(1).required(), // Job Description
    responsibilities: Joi.string().min(1).required(), // Key Responsibilities
    requirements: Joi.string().min(1).required(), // Requirements
    jobLevel: Joi.string().optional().allow('') // For job details page display
  }),

  updateJobStatus: Joi.object({
    status: Joi.string().valid('open', 'closed').required()
  }),

  updateApplicationStatus: Joi.object({
    status: Joi.string().valid('shortlisted', 'interview_scheduled', 'rejected').required()
  }),

  scheduleInterview: Joi.object({
    title: Joi.string().valid('Scheduled Interview').default('Scheduled Interview'),
    date: Joi.date().iso().min(new Date().toISOString().split('T')[0]).required().messages({
        'date.min': 'Interview date must be today or in the future'
    }),
    startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
        'string.pattern.base': 'Start time must be in HH:mm format'
    }),
    endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
        'string.pattern.base': 'End time must be in HH:mm format'
    })
  })
};

// --- Joi Schemas for Student ---
const studentSchemas = {
  applyForJob: Joi.object({
    firstName: Joi.string().min(1).required(),
    middleName: Joi.string().optional().allow(''),
    lastName: Joi.string().min(1).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
        'string.pattern.base': 'Phone number must be 10 digits'
    }),
    coverLetter: Joi.string().min(1).required(),
    experience: Joi.string().optional().allow(''), // e.g., "3 years", "Fresh"
    availability: Joi.string().optional().allow('') // e.g., "Immediately"
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().min(1).optional(),
    lastName: Joi.string().min(1).optional(),
    mobile: Joi.string().pattern(/^[0-9]{10}$/).optional().messages({
        'string.pattern.base': 'Mobile number must be 10 digits'
    }),
    about: Joi.string().optional().allow(''),
    imageUrl: Joi.string().uri().optional().allow(null, ''),
    education: Joi.array().items(Joi.object({
      id: Joi.string().uuid().optional(),
      collegeName: Joi.string().required(),
      universityName: Joi.string().optional().allow(''),
      courseName: Joi.string().required(),
      startYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
      endYear: Joi.number().integer().min(Joi.ref('startYear')).max(new Date().getFullYear() + 5).optional().allow(null),
      gpa: Joi.string().optional().allow('') // <-- This is also updated here for PATCH /student/profile
    })).optional().default([]),
    certifications: Joi.array().items(Joi.object({
      id: Joi.string().uuid().optional(),
      name: Joi.string().required(),
      issuedBy: Joi.string().required(),
      description: Joi.string().optional().allow(''),
      dateReceived: Joi.date().iso().required(),
      hasExpiry: Joi.boolean().required(),
      expiryDate: Joi.date().iso().allow(null).when('hasExpiry', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
      certificateLink: Joi.string().uri().optional().allow('')
    })).optional().default([]),
    skills: Joi.array().items(Joi.string().max(20)).max(12).optional().default([])
  })
};

// --- Joi Schemas for Helpdesk ---
const helpdeskSchemas = {
  createHelpRequest: Joi.object({
    subject: Joi.string().min(1).required(),
    message: Joi.string().min(1).required()
  })
};

// Middleware for onboarding validation with file upload
const validateOnboarding = (req, res, next) => {
  let schema;
  const userRole = req.user.role; // req.user populated by authMiddleware

  let parsedProfileData;
  try {
    parsedProfileData = JSON.parse(req.body.profileData);
  } catch (parseError) {
    if (req.file) { // Clean up uploaded file if parsing failed
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file after JSON parse failure:', err);
      });
    }
    return res.status(400).json({ success: false, message: 'Invalid or missing profileData JSON format in request body.' });
  }

  // Choose schema based on user role
  if (userRole === 'student') {
    schema = authSchemas.studentOnboarding;
  } else if (userRole === 'school') {
    schema = authSchemas.schoolOnboarding;
  } else {
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file for invalid role:', err);
      });
    }
    return res.status(403).json({ success: false, message: 'Onboarding is only for student or school roles.' });
  }

  // --- DEBUGGING LINE ---
  console.log('DEBUG: Onboarding Schema being used:', JSON.stringify(schema.describe(), null, 2));
  // --- END DEBUGGING LINE ---

  const { error } = schema.validate(parsedProfileData, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.context.key,
      message: detail.message.replace(/"/g, '')
    }));
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file after Joi validation failure:', err);
      });
    }
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors } });
  }

  // If validation passes, attach the parsed data to req for the controller
  req.validatedProfileData = parsedProfileData;
  next();
};

module.exports = {
  validate,
  authSchemas,
  jobSchemas,
  studentSchemas,
  helpdeskSchemas,
  validateOnboarding
};