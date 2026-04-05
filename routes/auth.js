const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Render Pages
router.get('/login', (req, res) => {
  // Pass query params (like error messages) to template if needed
  res.render('login', { msg: req.query.msg });
});

router.get('/register', (req, res) => {
  res.render('register');
});

// API Routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

module.exports = router;
