// backend/config/database.js

const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: process.env.DB_DIALECT,
  logging: false,
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// --- IMPORT AND DEFINE ALL MODELS HERE ---
// Call the exported function from each model file to define the model
const User = require('../models/User')(sequelize, DataTypes);
const Student = require('../models/Student')(sequelize, DataTypes);
const School = require('../models/School')(sequelize, DataTypes);
const Job = require('../models/Job')(sequelize, DataTypes);
const Application = require('../models/Application')(sequelize, DataTypes);
const Interview = require('../models/Interview')(sequelize, DataTypes);
const Notification = require('../models/Notification')(sequelize, DataTypes);
const Category = require('../models/Category')(sequelize, DataTypes);
const CoreSkill = require('../models/CoreSkill')(sequelize, DataTypes);
const StudentCoreSkillAssessment = require('../models/StudentCoreSkillAssessment')(sequelize, DataTypes);
const Education = require('../models/Education')(sequelize, DataTypes);
const Certification = require('../models/Certification')(sequelize, DataTypes);
const HelpRequest = require('../models/HelpRequest')(sequelize, DataTypes); // Ensure HelpRequest is also defined


// --- DEFINE ALL ASSOCIATIONS HERE ---
// User Associations
User.hasOne(Student, { foreignKey: 'userId', onDelete: 'CASCADE', hooks: true });
Student.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(School, { foreignKey: 'userId', onDelete: 'CASCADE', hooks: true });
School.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Notification, { foreignKey: 'userId', onDelete: 'CASCADE', hooks: true });
Notification.belongsTo(User, { foreignKey: 'userId' });

// Student Associations
Student.hasMany(Education, { foreignKey: 'studentId', onDelete: 'CASCADE', hooks: true, as: 'educations' }); // Added 'as'
Education.belongsTo(Student, { foreignKey: 'studentId' });

Student.hasMany(Certification, { foreignKey: 'studentId', onDelete: 'CASCADE', hooks: true, as: 'certifications' }); // Added 'as'
Certification.belongsTo(Student, { foreignKey: 'studentId' });

Student.hasMany(StudentCoreSkillAssessment, { foreignKey: 'studentId', onDelete: 'CASCADE', hooks: true, as: 'coreSkillAssessments' }); // Added 'as'
StudentCoreSkillAssessment.belongsTo(Student, { foreignKey: 'studentId' });

Student.hasMany(Application, { foreignKey: 'studentId', onDelete: 'CASCADE', hooks: true });
Application.belongsTo(Student, { foreignKey: 'studentId' });

// School Associations
School.hasMany(Job, { foreignKey: 'schoolId', onDelete: 'CASCADE', hooks: true });
Job.belongsTo(School, { foreignKey: 'schoolId' });

// School <-> Category (Many-to-Many for School Profile Categories)
School.belongsToMany(Category, {
  through: 'SchoolCategories',
  foreignKey: 'schoolId',
  otherKey: 'categoryId',
  onDelete: 'CASCADE',
  hooks: true
});
Category.belongsToMany(School, {
  through: 'SchoolCategories',
  foreignKey: 'categoryId',
  otherKey: 'schoolId',
  onDelete: 'CASCADE',
  hooks: true
});

// Job Associations
Job.belongsTo(Category, { foreignKey: 'categoryId', as: 'jobType' });
Category.hasMany(Job, { foreignKey: 'categoryId' }); // A Category can have many Jobs

Job.hasMany(Application, { foreignKey: 'jobId', onDelete: 'CASCADE', hooks: true });
Application.belongsTo(Job, { foreignKey: 'jobId' });

// Application Associations
Application.hasOne(Interview, { foreignKey: 'applicationId', onDelete: 'CASCADE', hooks: true, as: 'interview' }); // Added 'as'
Interview.belongsTo(Application, { foreignKey: 'applicationId' });

// CoreSkill Associations
CoreSkill.hasMany(StudentCoreSkillAssessment, { foreignKey: 'coreSkillId', onDelete: 'CASCADE', hooks: true, as: 'assessments' }); // Added 'as'
StudentCoreSkillAssessment.belongsTo(CoreSkill, { foreignKey: 'coreSkillId' });

CoreSkill.belongsToMany(Category, {
  through: 'CategoryCoreSkills',
  foreignKey: 'coreSkillId',
  otherKey: 'categoryId',
  onDelete: 'CASCADE',
  hooks: true
});
Category.belongsToMany(CoreSkill, {
  through: 'CategoryCoreSkills',
  foreignKey: 'categoryId',
  otherKey: 'coreSkillId',
  onDelete: 'CASCADE',
  hooks: true
});

// HelpRequest Association
HelpRequest.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(HelpRequest, { foreignKey: 'userId', as: 'helpRequests' });


// Test the database connection and sync models
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    // Sync all models. { force: true } drops existing tables. Use with caution in production.
    await sequelize.sync({ force: false }); // Set to true for development to recreate tables
    console.log('Database synced successfully. All models were synchronized.');
    // Call seed function here if needed for development
    // require('./seed')();
  } catch (error) {
    console.error('Unable to connect to the database or sync models:', error);
    process.exit(1); // Exit the process if database connection or sync fails
  }
}

// Export the sequelize instance AND the defined models
module.exports = {
  sequelize,
  User,
  Student,
  School,
  Job,
  Application,
  Interview,
  Notification,
  Category,
  CoreSkill,
  StudentCoreSkillAssessment,
  Education,
  Certification,
  HelpRequest,
  initializeDatabase // Export the initialization function
};
