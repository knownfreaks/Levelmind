// backend/models/Education.js

// This file defines the Education model for a student's academic history.
// It exports a function that takes the sequelize instance and DataTypes as arguments.
module.exports = (sequelize, DataTypes) => {
  const Education = sequelize.define('Education', {
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
      onDelete: 'CASCADE' // If a student is deleted, their education records are also deleted
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
      allowNull: true // Can be null if ongoing education
    },
    gpa: {
      type: DataTypes.STRING, // Store as string to allow flexible formats like "4.0", "3.8/4.0"
      allowNull: true
    }
  }, {
    // Model options
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    tableName: 'Educations' // Explicitly define table name
  });

  // IMPORTANT: Associations are defined centrally in backend/config/database.js

  return Education; // Return the defined Education model
};
