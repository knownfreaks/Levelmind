// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'school', 'student'),
    allowNull: false
  },
  // This flag will indicate if the user needs to complete onboarding after first login
  isOnboardingComplete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = User;