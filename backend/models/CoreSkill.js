// backend/models/CoreSkill.js

// This file defines the CoreSkill model, representing general skills (e.g., "Mathematics", "Communication").
// It exports a function that takes the sequelize instance and DataTypes as arguments.
module.exports = (sequelize, DataTypes) => {
  const CoreSkill = sequelize.define('CoreSkill', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: { // Name of the core skill (e.g., "Computer Science", "Mathematics", "English")
      type: DataTypes.STRING,
      allowNull: false,
      unique: true // Core skill names should be unique
    },
    subSkills: { // Array of specific sub-skills within this core skill (e.g., ["Algebra", "Geometry"] for "Mathematics")
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: false
    }
  }, {
    // Model options
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    tableName: 'CoreSkills' // Explicitly define table name
  });

  // IMPORTANT: Associations are defined centrally in backend/config/database.js

  return CoreSkill; // Return the defined CoreSkill model
};
