// models/Education.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Student = require('./Student'); // Import Student model

const Education = sequelize.define('Education', {
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
  collegeName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  universityName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  courseName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  startYear: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  endYear: {
    type: DataTypes.INTEGER,
    allowNull: true // Can be null if ongoing
  },
  gpa: {
    type: DataTypes.STRING, // Store as string to allow "4.0", "3.8/4.0"
    allowNull: true
  }
}, {
  timestamps: true
});

// Define association: An Education entry belongs to a Student
Education.belongsTo(Student, { foreignKey: 'studentId' });
// Define association: A Student can have many Education entries
Student.hasMany(Education, { foreignKey: 'studentId', as: 'educations' });

module.exports = Education;