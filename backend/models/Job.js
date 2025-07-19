// backend/models/Job.js

// This file defines the Job model, representing job postings by schools.
// It exports a function that takes the sequelize instance and DataTypes as arguments.
module.exports = (sequelize, DataTypes) => {
  const Job = sequelize.define('Job', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    schoolId: { // Foreign key linking to the School that posted the job
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Schools', // Reference the table name directly
        key: 'id'
      },
      onDelete: 'CASCADE' // If a school is deleted, its job postings are also deleted
    },
    categoryId: { // Foreign key linking to the Category (Job Type)
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Categories', // Reference the table name directly
        key: 'id'
      }
      // onDelete is not set here because deleting a category should not delete jobs,
      // but rather set categoryId to null or require manual handling.
      // For now, if a category is deleted, jobs referencing it might cause integrity issues
      // unless handled in the controller or a database migration.
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false // Job title is required
    },
    location: { // Job location (can be prefilled from school address)
      type: DataTypes.STRING,
      allowNull: false
    },
    applicationEndDate: {
      type: DataTypes.DATEONLY, // Date format YYYY-MM-DD
      allowNull: false // Application end date is required
    },
    subjectsToTeach: { // Array of subjects (e.g., ["Mathematics", "Physics"])
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [] // Stored as an array of strings
    },
    minSalaryLPA: { // Minimum salary in Lakhs Per Annum
      type: DataTypes.FLOAT,
      allowNull: false
    },
    maxSalaryLPA: { // Maximum salary in Lakhs Per Annum
      type: DataTypes.FLOAT,
      allowNull: true // Max salary is optional
    },
    jobDescription: { // Corresponds to 'overview' in frontend spec
      type: DataTypes.TEXT,
      allowNull: false
    },
    keyResponsibilities: { // Corresponds to 'responsibilities' in frontend spec
      type: DataTypes.TEXT,
      allowNull: false
    },
    requirements: { // Corresponds to 'education' and 'skills' in frontend spec
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: { // Job status: 'open' or 'closed'
      type: DataTypes.ENUM('open', 'closed'),
      defaultValue: 'open',
      allowNull: false
    },
    jobLevel: { // For frontend's "jobLevel" (e.g., "Entry-level", "Mid-level", "Senior")
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    // Model options
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    tableName: 'Jobs' // Explicitly define table name
  });

  // IMPORTANT: Associations are defined centrally in backend/config/database.js

  return Job; // Return the defined Job model
};
