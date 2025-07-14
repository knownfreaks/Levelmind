// routes/notificationRoutes.js
const express = require('express');
const {
  getNotifications,
  markNotificationAsRead
} = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All notification routes require authentication
router.use(authMiddleware);

router.get('/', getNotifications);
router.post('/:id/mark-as-read', markNotificationAsRead);

module.exports = router;