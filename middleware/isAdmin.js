const User = require('../models/User');

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user && user.role === 'admin') {
      next();
    } else {
      res.status(403).send('Forbidden: Access is denied. You must be an admin to view this page.');
    }
  } catch (error) {
    res.status(500).send('Server Error Admin Check');
  }
};

module.exports = isAdmin;
