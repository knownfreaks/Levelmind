// backend/models/Application.js

// This file defines the Application model, representing a student's application to a job.
// It exports a function that takes the sequelize instance and DataTypes as arguments.
module.exports = (sequelize, DataTypes) => {
  const Application = sequelize.define('Application', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    studentId: { // Foreign key linking to the Student who applied
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Students', // Reference the table name directly
        key: 'id'
      },
      onDelete: 'CASCADE' // If a student is deleted, their applications are also deleted
    },
    jobId: { // Foreign key linking to the Job they applied for
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Jobs', // Reference the table name directly
        key: 'id'
      },
      onDelete: 'CASCADE' // If a job is deleted, its applications are also deleted
    },
    applicationDate: {
      type: DataTypes.DATEONLY, // YYYY-MM-DD
      defaultValue: DataTypes.NOW, // Automatically set to current date on creation
    },
    status: { // Current status of the application
      type: DataTypes.ENUM('applied', 'shortlisted', 'interview_scheduled', 'rejected', 'hired'),
      defaultValue: 'applied', // Default status when first applied
      allowNull: false
    },
    coverLetter: {
      type: DataTypes.TEXT,
      allowNull: true // Optional cover letter text
    },
    experience: { // Summary of relevant experience for this application
      type: DataTypes.TEXT,
      allowNull: true
    },
    availability: { // Student's availability for interview/start date
      type: DataTypes.TEXT,
      allowNull: true
    },
    resumeUrl: { // URL to the resume submitted for this specific application
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    // Model options
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    tableName: 'Applications', // Explicitly define table name
    indexes: [{ // Ensure a student can only apply to a specific job once
      unique: true,
      fields: ['studentId', 'jobId']
    }]
  });

  // IMPORTANT: Associations are defined centrally in backend/config/database.js

  return Application; // Return the defined Application model
};
