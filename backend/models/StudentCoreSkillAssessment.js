// backend/models/StudentCoreSkillAssessment.js

// This file defines the StudentCoreSkillAssessment model,
// which stores a student's performance in specific core skills (subskills).
// It acts as a join table with additional data (subSkillMarks).
// It exports a function that takes the sequelize instance and DataTypes as arguments.
module.exports = (sequelize, DataTypes) => {
  const StudentCoreSkillAssessment = sequelize.define('StudentCoreSkillAssessment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    studentId: { // Foreign key linking to the Student profile
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Students', // Reference the table name directly
        key: 'id'
      },
      onDelete: 'CASCADE' // If a student is deleted, their assessments are also deleted
    },
    coreSkillId: { // Foreign key linking to the CoreSkill
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'CoreSkills', // Reference the table name directly
        key: 'id'
      },
      onDelete: 'CASCADE' // If a core skill is deleted, its assessments are also deleted
    },
    // Stores marks for each sub-skill as a JSON object
    // e.g., { "Algebra": 8, "Geometry": 7, "Calculus": 9, "Statistics": 6 }
    subSkillMarks: {
      type: DataTypes.JSONB, // JSONB for PostgreSQL, JSON for other dialects
      allowNull: false,
      defaultValue: {}
    },
    // Virtual field to calculate total score from subSkillMarks
    totalScore: {
      type: DataTypes.VIRTUAL,
      get() {
        const marks = this.getDataValue('subSkillMarks');
        // Ensure marks is an object before reducing
        if (typeof marks === 'object' && marks !== null) {
          return Object.values(marks).reduce((sum, mark) => sum + mark, 0);
        }
        return 0; // Return 0 if no marks or invalid format
      }
    }
  }, {
    // Model options
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    tableName: 'StudentCoreSkillAssessments', // Explicitly define table name
    indexes: [{ // Ensure a student has only one assessment per core skill
      unique: true,
      fields: ['studentId', 'coreSkillId']
    }]
  });

  // IMPORTANT: Associations are defined centrally in backend/config/database.js

  return StudentCoreSkillAssessment; // Return the defined model
};
