// routes/adminRoutes.js
const express = require('express');
const {
  getAdminDashboard,
  getUsers,
  bulkCreateUsers,
  createCoreSkill,
  getCoreSkills,
  createCategory,
  getCategories,
  uploadStudentCoreSkillMarks,
  updateUserPasswordByAdmin,
  // Import the new controller function for bulk skill marks
  bulkUploadStudentCoreSkillMarks // <--- ADDED THIS LINE
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware'); // General validator
const { uploadProfileImage } = require('../config/multer'); // Multer for profile images/logos. For excel, we need a separate multer config.
const Joi = require('joi'); // For inline validation schemas

// For bulk upload (Excel files), we need a specific multer storage
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const excelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/temp_excel');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Ensure filename is unique to prevent clashes
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const uploadExcel = multer({
  storage: excelStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || // .xlsx
        file.mimetype === 'application/vnd.ms-excel' || // .xls
        file.mimetype === 'text/csv' // Also allow CSV for flexibility
        ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) or CSV files (.csv) are allowed!'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit for excel/csv
});


const router = express.Router();

// All admin routes should be protected by authMiddleware and authorizeRoles('admin')
router.use(authMiddleware);
router.use(authorizeRoles('admin'));

// Admin Dashboard
router.get('/dashboard', getAdminDashboard);

// User Management
router.get('/users', getUsers);
router.post('/users/bulk-create', uploadExcel.single('file'), bulkCreateUsers);
router.patch('/users/:id/password', validate(Joi.object({
  newPassword: Joi.string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be at least 8 characters long.',
      'any.required': 'New password is required.'
    })
})), updateUserPasswordByAdmin);

// Core Skill Management
router.post('/skills', validate(Joi.object({
  name: Joi.string().min(1).required(),
  subskills: Joi.array().items(Joi.string().min(1)).min(1).max(4).required()
})), createCoreSkill);
router.get('/skills', getCoreSkills);

// New route for bulk uploading core skill marks
router.post('/skills/:coreSkillId/bulk-marks-upload', uploadExcel.single('file'), bulkUploadStudentCoreSkillMarks); // <--- ADDED THIS ROUTE

// Category Management
router.post('/categories', validate(Joi.object({
  name: Joi.string().min(1).required(),
  skills: Joi.array().items(Joi.string().uuid()).optional().default([])
})), createCategory);
router.get('/categories', getCategories);

// Student Core Skill Assessment (single upload)
router.post('/skills/:userId/marks', validate(Joi.object({
  skill_id: Joi.string().uuid().required(),
  subskills: Joi.array().items(Joi.object({
    name: Joi.string().min(1).required(),
    mark: Joi.number().integer().min(0).max(10).required()
  })).min(1).required()
})), uploadStudentCoreSkillMarks);


module.exports = router;

