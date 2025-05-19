const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.header('Authorization');
  console.log('AUTH HEADER:', token); // DEBUG: print the raw Authorization header
  let realToken = token;
  if (token && token.startsWith('Bearer ')) {
    realToken = token.slice(7);
  }
  console.log('JWT TO VERIFY:', realToken); // DEBUG: print the JWT to be verified
  if (!realToken) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(realToken, process.env.JWT_SECRET);
    console.log('JWT DECODED:', decoded); // DEBUG: print the decoded payload
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT VERIFY ERROR:', error); // DEBUG: print error details
    res.status(400).json({ error: 'Invalid token.' });
  }
};

module.exports = authenticate;
