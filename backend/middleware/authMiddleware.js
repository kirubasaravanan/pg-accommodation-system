const jwt = require('jsonwebtoken');

const protect = (req, res, next) => { // Renamed from authenticate to protect for clarity
  const authHeader = req.header('Authorization');
  // console.log('AUTH HEADER:', authHeader); // DEBUG: print the raw Authorization header
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided or token is not Bearer type.' });
  }
  
  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  // console.log('JWT TO VERIFY:', token); // DEBUG: print the JWT to be verified
  
  if (!token) { // Should be caught by previous check, but good for robustness
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log('JWT DECODED:', decoded); // DEBUG: print the decoded payload
    req.user = decoded; // Assuming decoded payload contains user info including role
    next();
  } catch (error) {
    // console.error('JWT VERIFY ERROR:', error); // DEBUG: print error details
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    res.status(400).json({ message: 'Invalid token.' }); // Fallback for other errors
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') { // Changed to 'Admin' (capital A)
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin.' });
  }
};

module.exports = { protect, admin };
