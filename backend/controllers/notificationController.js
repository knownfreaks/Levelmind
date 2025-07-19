// controllers/notificationController.js
const { User, Student, School, Job, Application, Interview, Notification, Category, CoreSkill, StudentCoreSkillAssessment, Education, Certification, HelpRequest } = require('../config/database');
const { Op } = require('sequelize'); // For filtering unread/all

// @desc    Get notifications for the authenticated user
// @route   GET /api/notifications
// @access  Private (AuthRequired)
const getNotifications = async (req, res, next) => {
  const { id: userId } = req.user;
  const { status = 'unread', limit = 10, offset = 0 } = req.query; // 'unread' or 'all'

  let whereClause = { userId };
  if (status === 'unread') {
    whereClause.isRead = false;
  }

  try {
    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    const formattedNotifications = notifications.map(notif => ({
      id: notif.id,
      text: notif.message, // Frontend expects 'text' for message
      type: notif.type, // 'success' | 'error' | 'info'
      timestamp: notif.createdAt, // createdAt from DB
      isRead: notif.isRead,
      link: notif.link // Optional deep link
    }));

    res.status(200).json({
      success: true,
      message: 'Notifications fetched successfully.',
      data: {
        notifications: formattedNotifications,
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        currentPage: Math.floor(offset / limit) + 1
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    next(error);
  }
};

// @desc    Mark a specific notification as read
// @route   POST /api/notifications/:id/mark-as-read
// @access  Private (AuthRequired)
const markNotificationAsRead = async (req, res, next) => {
  const { id: notificationId } = req.params;
  const { id: userId } = req.user;

  try {
    const notification = await Notification.findOne({ where: { id: notificationId, userId } });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found or you do not have permission to modify it.' });
    }

    if (notification.isRead) {
      return res.status(200).json({ success: true, message: 'Notification already marked as read.' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    next(error);
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead
};