// models/Job.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const School = require('./School');
const Category = require('./Category'); // Job Type / Category

const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  schoolId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: School,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  categoryId: { // Links to Category (Job Type)
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Category,
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: { // Prefilled from school address
    type: DataTypes.STRING,
    allowNull: false
  },
  applicationEndDate: {
    type: DataTypes.DATEONLY, // YYYY-MM-DD
    allowNull: false
  },
  subjectsToTeach: { // Array of strings (e.g., ["Mathematics", "Physics"])
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  minSalaryLPA: { // Minimum salary in Lakhs Per Annum
    type: DataTypes.FLOAT,
    allowNull: false
  },
  maxSalaryLPA: { // Maximum salary in Lakhs Per Annum
    type: DataTypes.FLOAT,
    allowNull: true
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
  // We'll calculate 'status' (open/closed) based on applicationEndDate
  // However, frontend wants a patch endpoint, so we add a direct status field too.
  status: {
    type: DataTypes.ENUM('open', 'closed'),
    defaultValue: 'open',
    allowNull: false
  },
  jobLevel: { // For frontend's "jobLevel" (Entry/Mid/Senior)
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

// Define associations
Job.belongsTo(School, { foreignKey: 'schoolId' });
Job.belongsTo(Category, { foreignKey: 'categoryId', as: 'jobType' }); // Alias for easier fetching
School.hasMany(Job, { foreignKey: 'schoolId', as: 'jobsPosted' });
Category.hasMany(Job, { foreignKey: 'categoryId', as: 'jobs' });

module.exports = Job;