// models/Student.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User'); // Import the User model

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    unique: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: true // Can be null initially during registration
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: true
  },
  about: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true // URL to profile picture
  },
  // Academic Skills / User-added skills (like "Teamwork", "Communication")
  skills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  // For the frontend's "Teaching Skills", "Personal Strengths", "Tools & Technologies", "Academic Achievements"
  // We can store these as JSONB or separate tables. For simplicity initially, JSONB for flexible fields.
  // academicSkills: { // General academic skills tags
  //   type: DataTypes.ARRAY(DataTypes.STRING),
  //   defaultValue: []
  // },
  // teachingSkills: {
  //   type: DataTypes.JSONB, // e.g., [{"label": "Mathematics Education", "value": 95}]
  //   defaultValue: []
  // },
  // personalStrengths: {
  //   type: DataTypes.JSONB, // e.g., [{"label": "Communication", "value": 95}]
  //   defaultValue: []
  // },
  // tools: {
  //   type: DataTypes.ARRAY(DataTypes.STRING),
  //   defaultValue: []
  // },
  // publications: {
  //   type: DataTypes.JSONB, // e.g., [{"title": "...", "journal": "...", "year": 2024, "authorRole": "..."}]
  //   defaultValue: []
  // },
  // position: { // Derived or directly input
  //   type: DataTypes.STRING,
  //   allowNull: true
  // },
  // location: { // Derived from address, or directly input
  //   type: DataTypes.STRING,
  //   allowNull: true
  // }
}, {
  timestamps: true
});

// Define association: A Student belongs to a User
Student.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
// Define association: A User can have one Student profile
User.hasOne(Student, { foreignKey: 'userId', onDelete: 'CASCADE' });

module.exports = Student;