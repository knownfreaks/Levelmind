// backend/server.js

// Load environment variables from .env file
require('dotenv').config();

// Import necessary modules
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import database configuration and initialization function
// Destructure 'sequelize' instance and 'initializeDatabase' function from the exported object
const { sequelize, initializeDatabase } = require('./config/database'); // <--- MODIFIED LINE

// --- REMOVE ALL INDIVIDUAL MODEL IMPORTS FROM HERE ---
// require('./models/User');
// require('./models/School');
// ... etc. ...
// --- END REMOVE ---

// Initialize Express app
const app = express();

// --- Middleware Setup ---
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Routes ---
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const studentRoutes = require('./routes/studentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const helpdeskRoutes = require('./routes/helpdeskRoutes');
const sharedAdminRoutes = require('./routes/sharedAdminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/school', schoolRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/help', helpdeskRoutes);

app.use('/api', sharedAdminRoutes); // Handles /api/admin/categories (GET)
app.use('/api/admin', adminRoutes); // Handles other /api/admin/* routes
app.use('/api/upload', uploadRoutes);


// Basic route for API root
app.get('/api', (req, res) => {
  res.send('Welcome to the Recruitment Platform API!');
});

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
  });
});


// --- Start the Server ---
const PORT = process.env.PORT || 5000;

// Call the database initialization function and then start the server
initializeDatabase() // <--- MODIFIED: Call the initialization function
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Access the API at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to start server due to database error:', err);
    process.exit(1);
  });
// Export the app for testing purposes