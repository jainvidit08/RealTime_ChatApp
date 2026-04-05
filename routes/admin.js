const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verifyJWT = require('../middleware/verifyJWT');
const isAdmin = require('../middleware/isAdmin');

// Apply double protection: Must be logged in WITH valid JWT, AND Must be an Admin
router.use(verifyJWT);
router.use(isAdmin);

router.get('/', adminController.getDashboard);

module.exports = router;
