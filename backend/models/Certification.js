// models/Certification.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Student = require('./Student'); // Import Student model

const Certification = sequelize.define('Certification', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  issuedBy: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dateReceived: {
    type: DataTypes.DATEONLY, // YYYY-MM-DD
    allowNull: false
  },
  hasExpiry: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  expiryDate: {
    type: DataTypes.DATEONLY, // YYYY-MM-DD
    allowNull: true // Null if hasExpiry is false
  },
  certificateLink: {
    type: DataTypes.STRING, // URL to uploaded certificate file
    allowNull: true
  },
  // Derived status for frontend display (Active/Expired) - backend logic will determine this
  // status: { type: DataTypes.VIRTUAL, get() { ... } }
}, {
  timestamps: true
});

// Define association: A Certification belongs to a Student
Certification.belongsTo(Student, { foreignKey: 'studentId' });
// Define association: A Student can have many Certifications
Student.hasMany(Certification, { foreignKey: 'studentId', as: 'certifications' });

module.exports = Certification;