// models/Interview.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Application = require('./Application'); // Link to the application it relates to

const Interview = sequelize.define('Interview', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  applicationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Application,
      key: 'id'
    },
    onDelete: 'CASCADE',
    unique: true // One interview per application (for a given job)
  },
  title: {
    type: DataTypes.STRING,
    defaultValue: 'Scheduled Interview', // Fixed as per frontend spec
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY, // YYYY-MM-DD
    allowNull: false
  },
  startTime: {
    type: DataTypes.TIME, // HH:mm:ss
    allowNull: false
  },
  endTime: {
    type: DataTypes.TIME, // HH:mm:ss
    allowNull: false
  },
  location: { // Prefilled from school's address
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true
});

// Define association
Interview.belongsTo(Application, { foreignKey: 'applicationId' });
Application.hasOne(Interview, { foreignKey: 'applicationId', as: 'interview' }); // An application can have one interview scheduled

module.exports = Interview;