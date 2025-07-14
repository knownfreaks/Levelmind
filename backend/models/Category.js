// models/Category.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const CoreSkill = require('./CoreSkill'); // Import CoreSkill model

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  // Array of CoreSkill IDs that this category includes
  coreSkillIds: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: [],
    allowNull: false
  }
}, {
  timestamps: true
});

// Define a many-to-many relationship through a join table (or just store IDs in array)
// For simplicity and matching frontend, storing IDs in array for now.
// If detailed linking with CoreSkill model is needed, a join table (CategoryCoreSkill) would be better.

module.exports = Category;