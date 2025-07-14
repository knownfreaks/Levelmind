// config/database.js

const { Sequelize } = require('sequelize');

// Load database configuration from environment variables
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_DIALECT = process.env.DB_DIALECT; // 'postgres'

// Create a new Sequelize instance
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: DB_DIALECT,
  logging: false, // Set to true to see SQL queries in console
  dialectOptions: {
    // Optional: SSL configuration for production if using a cloud database that requires it
    // ssl: {
    //   require: true,
    //   rejectUnauthorized: false // Adjust for production environments as needed
    // }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test the database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1); // Exit the process if database connection fails
  }
}

// Call the test connection function immediately
testConnection();

// Export the sequelize instance for use in models
module.exports = sequelize;