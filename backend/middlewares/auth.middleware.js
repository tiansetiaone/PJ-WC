const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // 1. Check if Authorization header exists
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ 
      error: 'Authorization header missing',
      code: 'MISSING_AUTH_HEADER'
    });
  }

  // 2. Verify Bearer token format
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ 
      error: 'Invalid token format. Use: Bearer <token>',
      code: 'INVALID_TOKEN_FORMAT'
    });
  }

  // 3. Verify JWT
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user data to request
    req.user = {
      id: decoded.id,
      role: decoded.role || 'user', // Default to 'user' if not specified
      email: decoded.email
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Authenticated user: ${req.user.email} with role ${req.user.role}`);
    }
    
    next();
  } catch (err) {
    // Handle specific JWT errors
    const errorMsg = err.name === 'TokenExpiredError' 
      ? 'Token expired' 
      : 'Invalid token';
    
    return res.status(403).json({ 
      error: errorMsg,
      code: err.name || 'INVALID_TOKEN'
    });
  }
};

// Admin only middleware
module.exports.adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Access denied for user ${req.user?.email} with role ${req.user?.role}`);
    }
    
    return res.status(403).json({
      error: 'Admin privileges required',
      code: 'ADMIN_ACCESS_REQUIRED',
      current_role: req.user?.role
    });
  }
  next();
};