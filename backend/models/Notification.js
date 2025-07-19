// backend/models/Notification.js

// This file defines the Notification model for user notifications.
// It exports a function that takes the sequelize instance and DataTypes as arguments.
module.exports = (sequelize, DataTypes) => {
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
        model: 'Users', // Reference the table name directly
        key: 'id'
      },
      onDelete: 'CASCADE' // If a user is deleted, their notifications are also deleted
    },
    message: { // The content of the notification
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: { // Type of notification (e.g., 'info', 'success', 'error', 'application_update')
      type: DataTypes.STRING,
      allowNull: false
    },
    link: { // Optional deep link for frontend navigation (e.g., to an application page)
      type: DataTypes.STRING,
      allowNull: true
    },
    isRead: { // Flag to track if the user has read the notification
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    // Model options
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    tableName: 'Notifications' // Explicitly define table name
  });

  // IMPORTANT: Associations are defined centrally in backend/config/database.js

  return Notification; // Return the defined Notification model
};
