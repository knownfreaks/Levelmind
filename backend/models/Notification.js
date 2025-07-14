// models/Notification.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User'); // User who receives the notification

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  userId: { // The user who receives this notification
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: { // e.g., 'application_received', 'application_shortlisted', 'interview_scheduled', 'help_request', 'bulk_operation_complete', 'success', 'error' (for UI display)
    type: DataTypes.STRING,
    allowNull: false
  },
  link: { // Optional deep link for frontend navigation
    type: DataTypes.STRING,
    allowNull: true
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true // createdAt will serve as 'timestamp'
});

// Define association
Notification.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

module.exports = Notification;