const User = require('../models/User');
const webpush = require('web-push');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

exports.subscribe = async (req, res) => {
  try {
    const subscription = req.body;

    // Save subscription to the current user
    await User.findByIdAndUpdate(req.user.userId, {
      pushSubscription: subscription
    });

    res.status(201).json({ message: 'Push subscription saved successfully!' });
  } catch (err) {
    console.error('Push Subscribe Error:', err);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
};

exports.webpush = webpush;
