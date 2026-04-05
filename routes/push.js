const express = require('express');
const router = express.Router();
const pushController = require('../controllers/pushController');
const verifyJWT = require('../middleware/verifyJWT');

router.use(verifyJWT);
router.post('/subscribe', pushController.subscribe);

// Route for the frontend to easily fetch the public key 
router.get('/vapidPublicKey', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

module.exports = router;
