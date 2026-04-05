const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const verifyJWT = require('../middleware/verifyJWT');

// Any route in here is protected by the verifyJWT middleware
router.use(verifyJWT);

// The main chat dashboard
router.get('/', chatController.renderDashboard);

// API endpoint to fetch history dynamically when a room is clicked
router.get('/messages/:roomId', chatController.getMessages);

// API endpoint to create/fetch a private DM room
router.post('/private', chatController.createOrGetPrivateRoom);

module.exports = router;
