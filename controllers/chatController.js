const Room = require('../models/Room');
const Message = require('../models/Message');

exports.renderDashboard = async (req, res) => {
  try {
    // 1. Fetch rooms this user belongs to
    const rooms = await Room.find({ 
      $or: [
        { type: 'group' }, // All users can see group rooms
        { members: req.user.userId } // Private rooms they belong to
      ]
    }).populate('members', 'username');

    // 2. We pass the user object, roles, and rooms to the view
    res.render('chat', { 
      user: req.user,
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
