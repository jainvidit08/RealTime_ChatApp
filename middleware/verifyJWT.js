const jwt = require('jsonwebtoken');

const verifyJWT = (req, res, next) => {
  // We expect the token to be sent in an httpOnly cookie named 'accessToken'
  const token = req.cookies.accessToken;

  if (!token) {
    // If no token, redirect to login page
    return res.redirect('/auth/login');
  }

  try {
    // Verify the token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user info to the request object so subsequent routes can use it
    req.user = decoded;
    next(); // Move to the next middleware or route handler
  } catch (err) {
    console.error('JWT Verification Failed:', err.message);
    // Token is invalid or expired
    return res.redirect('/auth/login');
  }
};

module.exports = verifyJWT;
