// backend/models/Certification.js

// This file defines the Certification model for a student's professional certifications.
// It exports a function that takes the sequelize instance and DataTypes as arguments.
module.exports = (sequelize, DataTypes) => {
  const Certification = sequelize.define('Certification', {
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
      onDelete: 'CASCADE' // If a student is deleted, their certifications are also deleted
    },
    name: { // Name of the certification (e.g., "Google Certified Educator")
      type: DataTypes.STRING,
      allowNull: false
    },
    issuedBy: { // Issuing organization (e.g., "Google", "Coursera")
      type: DataTypes.STRING,
      allowNull: false
    },
    description: { // Optional description of the certification
      type: DataTypes.TEXT,
      allowNull: true
    },
    dateReceived: { // Date the certification was obtained
      type: DataTypes.DATEONLY, // YYYY-MM-DD
      allowNull: false
    },
    hasExpiry: { // Boolean indicating if the certification has an expiry date
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    expiryDate: { // Expiry date, if applicable
      type: DataTypes.DATEONLY, // YYYY-MM-DD
      allowNull: true
    },
    certificateLink: { // URL to the certificate document/image
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    // Model options
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    tableName: 'Certifications' // Explicitly define table name
  });

  // IMPORTANT: Associations are defined centrally in backend/config/database.js

  return Certification; // Return the defined Certification model
};
