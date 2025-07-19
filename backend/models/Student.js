// backend/models/Student.js

// This file defines the Student profile model.
// It exports a function that takes the sequelize instance and DataTypes as arguments.
module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define('Student', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    userId: { // Foreign key linking to the User model
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users', // Reference the table name directly
        key: 'id'
      },
      unique: true // Ensures a one-to-one relationship with User (one user has one student profile)
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true // Can be null initially during registration, filled during onboarding
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
      allowNull: true // Short description about the student
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true // URL to student's profile picture
    },
    resumeUrl: {
      type: DataTypes.STRING,
      allowNull: true // URL to student's resume
    },
    // General skills / User-added skills (e.g., "Teamwork", "Communication")
    skills: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [] // Stored as an array of strings
    }
  }, {
    // Model options
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    tableName: 'Students' // Explicitly define table name
  });

  // IMPORTANT: Associations are defined centrally in backend/config/database.js

  return Student; // Return the defined Student model
};
