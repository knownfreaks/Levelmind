// server.js

// Load environment variables from .env file
require('dotenv').config();

// Import necessary modules
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import database configuration
const sequelize = require('./config/database');

// Import all models to ensure they are defined with Sequelize
// Sequelize needs to know about all models before sync() is called.
require('./models/User');
require('./models/School');
require('./models/Student');
require('./models/Education');
require('./models/Certification');
require('./models/CoreSkill');
require('./models/StudentCoreSkillAssessment');
require('./models/Category');
require('./models/Job');
require('./models/Application');
require('./models/Interview');
require('./models/Notification');
require('./models/HelpRequest');

// Initialize Express app
const app = express();

// --- Middleware Setup ---
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Database Synchronization ---
// This will create tables if they don't exist based on your models
sequelize.sync()
  .then(() => {
    console.log('Database synced successfully. All models were synchronized.');
  })
  .catch(err => {
    console.error('Failed to sync database:', err);
    process.exit(1); // Exit if DB sync fails
  });

// --- Root Route for Testing ---
// This is a basic route for the root of the API, not the main application root.
app.get('/api', (req, res) => { // Changed from '/' to '/api' to match base URL
  res.send('Welcome to the Recruitment Platform API!');
});


// --- API Routes ---
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const studentRoutes = require('./routes/studentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const helpdeskRoutes = require('./routes/helpdeskRoutes');
// const publicJobRoutes = require('./routes/publicJobRoutes'); // If you have this file, keep it
const sharedAdminRoutes = require('./routes/sharedAdminRoutes'); // <--- ADDED THIS IMPORT
const uploadRoutes = require('./routes/uploadRoutes');


app.use('/api/auth', authRoutes);
app.use('/api/school', schoolRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/help', helpdeskRoutes);
// app.use('/api/jobs', publicJobRoutes); // If you have public job routes, uncomment this

// IMPORTANT: Order matters!
// Mount sharedAdminRoutes BEFORE adminRoutes if shared routes are sub-paths of admin
// Or, if sharedAdminRoutes handles full paths like '/admin/categories', mount it here.
app.use('/api', sharedAdminRoutes); // <--- ADDED THIS LINE: This router handles '/admin/categories'
app.use('/api/admin', adminRoutes); // This router handles all other '/admin/*' routes (admin-only)
app.use('/api/upload', uploadRoutes);


// --- Error Handling Middleware (Keep this as the last middleware) ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred.';

  if (err instanceof Error && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File size too large. Maximum allowed size exceeded.' });
  }
  if (err instanceof Error && err.message.includes('Allowed file types')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    // data: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});


// --- Start the Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the API at http://localhost:${PORT}`);
});
