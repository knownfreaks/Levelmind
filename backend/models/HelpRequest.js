// models/HelpRequest.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User'); // The user who submitted the request

const HelpRequest = sequelize.define('HelpRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  userId: { // The user who submitted the help request
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('open', 'resolved'),
    defaultValue: 'open',
    allowNull: false
  },
  // We can add an 'adminNotes' field later for resolution details
}, {
  timestamps: true // createdAt will serve as 'created_at'
});

// Define association
HelpRequest.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(HelpRequest, { foreignKey: 'userId', as: 'helpRequests' });

module.exports = HelpRequest;