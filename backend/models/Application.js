// models/Application.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Student = require('./Student');
const Job = require('./Job');

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Student,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Job,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  // Status to track application progress from school's perspective
  // Maps to "New Candidates", "In Progress", "Completed", "On Hold" from frontend for ApplicationsBoard
  status: {
    type: DataTypes.ENUM('applied', 'shortlisted', 'interview_scheduled', 'rejected'),
    defaultValue: 'applied',
    allowNull: false
  },
  // Optional: resume file upload (if direct upload for application form)
  resumeUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  coverLetter: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  experience: { // e.g., "3 years", "Fresh"
    type: DataTypes.STRING,
    allowNull: true
  },
  availability: { // e.g., "Immediately", "2 Weeks Notice"
    type: DataTypes.STRING,
    allowNull: true
  },
  // For frontend's `date` field (application date)
  applicationDate: {
    type: DataTypes.DATEONLY, // Store as YYYY-MM-DD
    defaultValue: DataTypes.NOW // Default to current date
  }
}, {
  timestamps: true,
  // Ensure a student can apply to a job only once
  indexes: [{
    unique: true,
    fields: ['studentId', 'jobId']
  }]
});

// Define associations
Application.belongsTo(Student, { foreignKey: 'studentId' });
Application.belongsTo(Job, { foreignKey: 'jobId' });
Student.hasMany(Application, { foreignKey: 'studentId', as: 'applications' });
Job.hasMany(Application, { foreignKey: 'jobId', as: 'applications' });

module.exports = Application;