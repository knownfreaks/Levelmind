// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
// Import User model from database.js
const { User } = require('../config/database'); // <--- MODIFIED LINE

const authMiddleware = async (req, res, next) => {
  let token;

  // Check if token is present in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by ID and attach to request object
      // User.findByPk is now correctly called on the Sequelize Model
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] } // Exclude password from the user object
      });

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized: User not found.' });
      }

      next(); // Proceed to the next middleware/route handler
    } catch (error) {
      console.error('Token verification error:', error.message); // Log the specific error message
      return res.status(401).json({ success: false, message: 'Not authorized: Token failed or expired.' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized: No token provided.' });
  }
};

module.exports = authMiddleware;
