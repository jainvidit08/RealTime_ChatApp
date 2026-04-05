const User = require('../models/User');
const Snapshot = require('../models/Snapshot');

exports.getDashboard = async (req, res) => {
  try {
    // Gather base analytics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ hasLoggedIn: true });
    
    // We get snapshots to plot on the chart.
    // They auto-delete every 24h because of our TTL index setup in Phase 1!
    const snapshots = await Snapshot.find().sort({ createdAt: 1 });

    res.render('admin', {
      user: req.user,
      stats: {
        totalUsers,
        activeUsers
      },
      snapshots // we will pass this as JSON to EJS to use in Chart.js
    });
  } catch (error) {
    console.error('Admin Dashboard Error:', error);
    res.status(500).send('Server Error');
  }
};
