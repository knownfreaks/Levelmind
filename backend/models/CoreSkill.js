// models/CoreSkill.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CoreSkill = sequelize.define('CoreSkill', {
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
  // Store sub-skills as an array of strings (max 4)
  subSkills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: [],
    // TEMPORARILY REMOVE THE VALIDATION BLOCK BELOW
    // validate: {
    //   len: [1, 4] // Ensure between 1 and 4 sub-skills
    // }
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = CoreSkill;