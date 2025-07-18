// routes/adminRoutes.js
const express = require('express');
const {
  getAdminDashboard,
  getUsers,
  bulkCreateUsers,
  createCoreSkill,
  getCoreSkills,
  createCategory, // <--- ADD THIS IMPORT BACK
  uploadStudentCoreSkillMarks,
  updateUserPasswordByAdmin,
  bulkUploadStudentCoreSkillMarks,
  deleteUser
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { uploadProfileImage } = require('../config/multer');
const Joi = require('joi');

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
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const uploadExcel = multer({
  storage: excelStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'text/csv'
        ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) or CSV files (.csv) are allowed!'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});


const router = express.Router();

// --- All routes below this line are Admin-only ---
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
router.delete('/users/:id', deleteUser);

// Core Skill Management
router.post('/skills', validate(Joi.object({
  name: Joi.string().min(1).required(),
  subskills: Joi.array().items(Joi.string().min(1)).min(1).max(4).required()
})), createCoreSkill);
router.get('/skills', getCoreSkills);

// Bulk Upload Student Core Skill Marks
router.post('/skills/:coreSkillId/bulk-marks-upload', uploadExcel.single('file'), bulkUploadStudentCoreSkillMarks);

// Student Core Skill Assessment (single upload)
router.post('/skills/:userId/marks', validate(Joi.object({
  skill_id: Joi.string().uuid().required(),
  subskills: Joi.array().items(Joi.object({
    name: Joi.string().min(1).required(),
    mark: Joi.number().integer().min(0).max(10).required()
  })).min(1).required()
})), uploadStudentCoreSkillMarks);

// Category Management (POST route remains Admin-only here)
router.post('/categories', validate(Joi.object({
  name: Joi.string().min(1).required(),
  skills: Joi.array().items(Joi.string().uuid()).optional().default([])
})), createCategory); // <--- THIS ROUTE DEFINITION

// This section (categoriesRouter) is now handled by sharedAdminRoutes.js for GET /admin/categories
// and POST /admin/categories is handled above.
// You do NOT need the categoriesRouter block here anymore if you moved POST /categories above.
// If you want POST /categories to be in sharedAdminRoutes too, then move it there.
// For now, let's assume POST /categories stays here.


module.exports = router;
// If you want to keep the POST /categories route in sharedAdminRoutes.js, you can remove it from here.
// Otherwise, this file now handles all admin routes including categories.