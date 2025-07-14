// routes/helpdeskRoutes.js
const express = require('express');
const {
  submitHelpRequest,
  getHelpRequests,
  resolveHelpRequest
} = require('../controllers/helpdeskController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const { validate, helpdeskSchemas } = require('../middleware/validationMiddleware');

const router = express.Router();

// Route for submitting help requests (accessible by any authenticated user)
router.post('/', authMiddleware, validate(helpdeskSchemas.createHelpRequest), submitHelpRequest);

// Routes for admin to view and resolve help requests
router.get('/', authMiddleware, authorizeRoles('admin'), getHelpRequests);
router.patch('/:id/resolve', authMiddleware, authorizeRoles('admin'), resolveHelpRequest);

module.exports = router;