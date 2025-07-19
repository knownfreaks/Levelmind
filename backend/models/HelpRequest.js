// backend/models/HelpRequest.js

// This file defines the HelpRequest model, for users to submit support requests.
// It exports a function that takes the sequelize instance and DataTypes as arguments.
module.exports = (sequelize, DataTypes) => {
  const HelpRequest = sequelize.define('HelpRequest', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    userId: { // The user who submitted the help request
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users', // Reference the table name directly
        key: 'id'
      },
      onDelete: 'CASCADE' // If a user is deleted, their help requests are also deleted
    },
    subject: { // Subject line of the help request
      type: DataTypes.STRING,
      allowNull: false
    },
    message: { // Detailed message of the help request
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: { // Status of the help request (e.g., 'open', 'resolved')
      type: DataTypes.ENUM('open', 'resolved'),
      defaultValue: 'open',
      allowNull: false
    },
    // You could add fields like 'adminNotes' or 'resolvedBy' later if needed
  }, {
    // Model options
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    tableName: 'HelpRequests' // Explicitly define table name
  });

  // IMPORTANT: Associations are defined centrally in backend/config/database.js

  return HelpRequest; // Return the defined HelpRequest model
};
