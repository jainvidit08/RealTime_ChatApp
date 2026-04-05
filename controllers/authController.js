const User = require('../models/User');
const Token = require('../models/Token');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper function to generate tokens
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash the password using bcrypt with a salt factor of 10
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Provide first user admin rights for demo, else user
    const totalUsers = await User.countDocuments();
    const role = totalUsers === 0 ? 'admin' : 'user';

    const newUser = new User({
      username,
      passwordHash,
      role
    });

    await newUser.save();
    res.redirect('/auth/login?msg=RegisteredSuccessfully');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Compare provided password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update hasLoggedIn if first time
    if (!user.hasLoggedIn) {
      user.hasLoggedIn = true;
      await user.save();
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    // Save refresh token to DB (with expiration 7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await Token.create({ userId: user._id, refreshToken, expiresAt });

    // Set tokens in HTTP-only cookies
    // HTTP-only means JavaScript on the client (browser) cannot access the cookie, preventing XSS attacks.
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000 // 15 mins
    });
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Redirect to chat dashboard
    res.redirect('/chat');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    
    // Remove the refresh token from the database to invalidate it
    if (refreshToken) {
      await Token.findOneAndDelete({ refreshToken });
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    res.redirect('/auth/login');
  } catch (error) {
    console.error(error);
    res.redirect('/auth/login');
  }
};
