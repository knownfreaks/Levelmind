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
  uploadStudentCoreSkillMarks
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
    cb(null, `bulk_upload-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const uploadExcel = multer({
  storage: excelStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed!'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit for excel
});


const router = express.Router();

// All admin routes should be protected by authMiddleware and authorizeRoles('admin')
router.use(authMiddleware);
router.use(authorizeRoles('admin'));

// Admin Dashboard
router.get('/dashboard', getAdminDashboard);

// User Management
router.get('/users', getUsers);
// Note: Frontend wants POST /api/admin/users/bulk-create with file:excel. Role in body.
router.post('/users/bulk-create', uploadExcel.single('file'), bulkCreateUsers);

// Core Skill Management
// Frontend expects POST /api/admin/skills with name and subskills
router.post('/skills', validate(Joi.object({
  name: Joi.string().min(1).required(),
  subskills: Joi.array().items(Joi.string().min(1)).min(1).max(4).required()
})), createCoreSkill); // Inline Joi validation for simple schema
router.get('/skills', getCoreSkills);

// Category Management
// Frontend expects POST /api/admin/categories with name and skills (UUIDs)
router.post('/categories', validate(Joi.object({
  name: Joi.string().min(1).required(),
  skills: Joi.array().items(Joi.string().uuid()).optional().default([]) // Array of UUIDs for core skills
})), createCategory);
router.get('/categories', getCategories);

// Student Core Skill Assessment
// Frontend expects POST /api/admin/skills/:studentId/marks with skill_id and subskills [{name, mark}]
router.post('/skills/:studentId/marks', validate(Joi.object({
  skill_id: Joi.string().uuid().required(),
  subskills: Joi.array().items(Joi.object({
    name: Joi.string().min(1).required(),
    mark: Joi.number().integer().min(0).max(10).required()
  })).min(1).required()
})), uploadStudentCoreSkillMarks);


module.exports = router;