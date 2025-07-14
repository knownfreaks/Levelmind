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
app.get('/', (req, res) => {
  res.send('Welcome to the Recruitment Platform API!');
});

// --- API Routes ---

// --- API Routes ---
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes'); // Import admin routes
const schoolRoutes = require('./routes/schoolRoutes'); // Import school routes
const studentRoutes = require('./routes/studentRoutes'); // Import student routes
const notificationRoutes = require('./routes/notificationRoutes'); // Import notification routes
const helpdeskRoutes = require('./routes/helpdeskRoutes'); // Import helpdesk routes

app.use('/api/auth', authRoutes); // Use auth routes under /api/auth prefix
app.use('/api/admin', adminRoutes); // Use admin routes under /api/admin prefix
app.use('/api/school', schoolRoutes); // Use school routes under /api/school prefix
app.use('/api/student', studentRoutes); // Use student routes under /api/student prefix
app.use('/api/notifications', notificationRoutes); // Use notifications routes
app.use('/api/help', helpdeskRoutes); // Use helpdesk routes


// --- Error Handling Middleware (Keep this as the last middleware) ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred.';

  // Check if error is from Multer (file upload)
  if (err instanceof Error && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File size too large. Maximum allowed size exceeded.' });
  }
  if (err instanceof Error && err.message.includes('Allowed file types')) { // Custom error message from fileFilter
    return res.status(400).json({ success: false, message: err.message });
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    // data: process.env.NODE_ENV === 'development' ? err.stack : undefined // Optional: send stack in dev
  });
});


// --- Start the Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the API at http://localhost:${PORT}`);
});