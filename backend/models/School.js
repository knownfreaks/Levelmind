// models/School.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User'); // Import the User model

const School = sequelize.define('School', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  // Foreign key linking to the User model
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    unique: true // Ensure one-to-one relationship
  },
  logoUrl: {
    type: DataTypes.STRING,
    allowNull: true // Can be null initially during registration
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  websiteLink: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pincode: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

// Define association: A School belongs to a User
School.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
// Define association: A User can have one School profile
User.hasOne(School, { foreignKey: 'userId', onDelete: 'CASCADE' });

module.exports = School;