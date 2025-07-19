// backend/models/Category.js

// This file defines the Category model, used for job types (e.g., "Teaching", "Administration").
// It exports a function that takes the sequelize instance and DataTypes as arguments.
module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: { // Name of the category (e.g., "Mathematics Teacher", "Science Teacher", "Administration")
      type: DataTypes.STRING,
      allowNull: false,
      unique: true // Category names should be unique
    },
    // This field stores an array of CoreSkill UUIDs associated with this category.
    // The actual association is defined in database.js using belongsToMany.
    coreSkillIds: {
      type: DataTypes.ARRAY(DataTypes.UUID), // Array of UUIDs
      defaultValue: [],
      allowNull: false
    }
  }, {
    // Model options
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    tableName: 'Categories' // Explicitly define table name
  });

  // IMPORTANT: Associations are defined centrally in backend/config/database.js

  return Category; // Return the defined Category model
};
