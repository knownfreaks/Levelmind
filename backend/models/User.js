// backend/models/User.js

// This file defines the User model.
// It exports a function that takes the sequelize instance and DataTypes as arguments,
// ensuring the model is defined with the correct Sequelize instance.
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false // User ID should always be present
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false, // User name is required
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Email must be unique for each user
      validate: {
        isEmail: true // Ensures the email is in a valid format
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false, // Hashed password is required
    },
    role: {
      type: DataTypes.ENUM('admin', 'school', 'student'), // Defines allowed roles
      allowNull: false, // Role is required
    },
    isOnboardingComplete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // Flag to track if user has completed their profile setup
    },
  }, {
    // Model options
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    tableName: 'Users' // Explicitly define table name (optional, but good practice)
  });

  // IMPORTANT: Associations are defined centrally in backend/config/database.js
  // This avoids circular dependencies and ensures all models are loaded before associations are set.

  return User; // Return the defined User model
};
