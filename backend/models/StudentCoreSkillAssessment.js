// models/StudentCoreSkillAssessment.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Student = require('./Student');
const CoreSkill = require('./CoreSkill');

const StudentCoreSkillAssessment = sequelize.define('StudentCoreSkillAssessment', {
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
  coreSkillId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: CoreSkill,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  // Stores marks for each sub-skill as a JSON object
  // e.g., { "Algebra": 8, "Geometry": 7, "Calculus": 9, "Statistics": 6 }
  subSkillMarks: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  // Virtual field to calculate total score
  totalScore: {
    type: DataTypes.VIRTUAL,
    get() {
      const marks = this.getDataValue('subSkillMarks');
      return Object.values(marks).reduce((sum, mark) => sum + mark, 0);
    }
  }
}, {
  timestamps: true,
  // Ensure a student has only one assessment per core skill
  indexes: [{
    unique: true,
    fields: ['studentId', 'coreSkillId']
  }]
});

// Define associations
StudentCoreSkillAssessment.belongsTo(Student, { foreignKey: 'studentId' });
StudentCoreSkillAssessment.belongsTo(CoreSkill, { foreignKey: 'coreSkillId' });
Student.hasMany(StudentCoreSkillAssessment, { foreignKey: 'studentId', as: 'coreSkillAssessments' });
CoreSkill.hasMany(StudentCoreSkillAssessment, { foreignKey: 'coreSkillId', as: 'assessments' });

module.exports = StudentCoreSkillAssessment;