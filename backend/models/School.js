// backend/models/School.js

module.exports = (sequelize, DataTypes) => {
  const School = sequelize.define('School', {
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
      unique: true // Ensures a one-to-one relationship with User (one user has one school profile)
    },
    // REMOVED: The 'name' field is no longer directly in the School model.
    // It is accessed via the associated User model (School.User.name).
    logoUrl: {
      type: DataTypes.STRING,
      allowNull: true // URL to the school's logo image
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true // Short description of the school
    },
    websiteLink: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true // Ensures the website link is a valid URL format
      }
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true
    },
    pincode: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    // Model options
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    tableName: 'Schools' // Explicitly define table name
  });

  // IMPORTANT: Associations are defined centrally in backend/config/database.js

  return School; // Return the defined School model
};
