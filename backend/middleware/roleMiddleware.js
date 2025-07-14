// middleware/roleMiddleware.js

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      // If authMiddleware didn't attach a user or role, something is wrong
      return res.status(401).json({ success: false, message: 'Not authorized, user role missing' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // If user's role is not in the allowed roles list
      return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to access this resource.' });
    }
    next(); // User has the required role, proceed
  };
};

module.exports = authorizeRoles;