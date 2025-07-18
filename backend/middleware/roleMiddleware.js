// backend/middleware/roleMiddleware.js
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // --- DEBUGGING START ---
    console.log('DEBUG: Inside authorizeRoles middleware');
    console.log('DEBUG: Required roles:', roles);
    console.log('DEBUG: Authenticated user role (req.user.role):', req.user ? req.user.role : 'N/A');
    // --- DEBUGGING END ---

    if (!req.user || !req.user.role) {
      // This should ideally be caught by authMiddleware first, but good safeguard
      return res.status(401).json({ success: false, message: 'Not authenticated: User role not found.' });
    }

    if (!roles.includes(req.user.role)) {
      // --- DEBUGGING START ---
      console.log(`DEBUG: User role '${req.user.role}' is NOT in allowed roles [${roles.join(', ')}]. Access denied.`);
      // --- DEBUGGING END ---
      return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to access this resource.' });
    }

    // --- DEBUGGING START ---
    console.log(`DEBUG: User role '${req.user.role}' is authorized.`);
    // --- DEBUGGING END ---
    next();
  };
};

module.exports = authorizeRoles;
