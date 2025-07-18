// backend/routes/sharedAdminRoutes.js
const express = require('express');
const {
  getCategories // Only import getCategories here
} = require('../controllers/adminController'); // getCategories is still in adminController

const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

// Apply authMiddleware first to ensure req.user is populated
router.use(authMiddleware);

// GET /api/admin/categories - Accessible by Admin and School roles
router.get('/admin/categories', authorizeRoles('admin', 'school'), getCategories);

module.exports = router;
