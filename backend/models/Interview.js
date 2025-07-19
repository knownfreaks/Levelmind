// backend/models/Interview.js

// This file defines the Interview model, representing scheduled interviews for applications.
// It exports a function that takes the sequelize instance and DataTypes as arguments.
module.exports = (sequelize, DataTypes) => {
  const Interview = sequelize.define('Interview', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    applicationId: { // Foreign key linking to the specific application this interview is for
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Applications', // Reference the table name directly
        key: 'id'
      },
      onDelete: 'CASCADE', // If an application is deleted, its interview is also deleted
      unique: true // Ensures one interview per application (for a given job)
    },
    title: { // Title of the interview (e.g., "First Round Interview", "Technical Interview")
      type: DataTypes.STRING,
      defaultValue: 'Scheduled Interview',
      allowNull: false
    },
    date: { // Date of the interview
      type: DataTypes.DATEONLY, // YYYY-MM-DD
      allowNull: false
    },
    startTime: { // Start time of the interview
      type: DataTypes.TIME, // HH:mm:ss
      allowNull: false
    },
    endTime: { // End time of the interview
      type: DataTypes.TIME, // HH:mm:ss
      allowNull: false
    },
    location: { // Interview location (e.g., "Online", "School Address")
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    // Model options
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    tableName: 'Interviews' // Explicitly define table name
  });

  // IMPORTANT: Associations are defined centrally in backend/config/database.js

  return Interview; // Return the defined Interview model
};
