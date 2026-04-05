const Room = require('../models/Room');
const Message = require('../models/Message');
const User = require('../models/User');

exports.renderDashboard = async (req, res) => {
  try {
    // Fetch the full user to ensure we have the robust username (in case old JWTs lack it)
    const fullUser = await User.findById(req.user.userId);

    // 1. Fetch rooms this user belongs to
    const rooms = await Room.find({ 
      $or: [
        { type: 'group' }, // All users can see group rooms
        { members: fullUser._id } // Private rooms they belong to
      ]
    }).populate('members', 'username');

    // 2. We pass the user object, roles, and rooms to the view
    res.render('chat', { 
      user: {
        userId: fullUser._id,
        username: fullUser.username,
        role: fullUser.role
      },
      rooms: rooms 
    });
  } catch (error) {
    console.error('Error fetching chat dashboard:', error);
    res.status(500).send('Server Error');
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Sort by oldest first, but limit to last 50 for performance
    const messages = await Message.find({ roomId })
      .populate('senderId', 'username')
      .sort({ createdAt: -1 })
      .limit(50);
      
    // Reverse array to render oldest to newest on screen
    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};
