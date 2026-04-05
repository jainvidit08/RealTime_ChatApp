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

    // Dynamically format Private Room names based on who is looking at it
    const formattedRooms = rooms.map(room => {
      let displayName = room.name;
      if (room.type === 'private') {
        const otherMember = room.members.find(m => m._id.toString() !== fullUser._id.toString());
        displayName = otherMember ? otherMember.username : 'Unknown User';
      }
      return {
        _id: room._id,
        name: displayName,
        type: room.type
      };
    });

    // 2. We pass the user object, roles, and formatted rooms to the view
    res.render('chat', { 
      user: {
        userId: fullUser._id,
        username: fullUser.username,
        role: fullUser.role
      },
      rooms: formattedRooms 
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

exports.createOrGetPrivateRoom = async (req, res) => {
  try {
    const { targetUsername } = req.body;
    const currentUserId = req.user.userId;

    const targetUser = await User.findOne({ username: targetUsername });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser._id.toString() === currentUserId.toString()) {
      return res.status(400).json({ error: 'You cannot chat with yourself' });
    }

    const existingRoom = await Room.findOne({
      type: 'private',
      members: { $all: [currentUserId, targetUser._id], $size: 2 }
    });

    if (existingRoom) {
      return res.status(200).json({ roomId: existingRoom._id });
    }

    const newRoom = new Room({
      type: 'private',
      members: [currentUserId, targetUser._id]
    });

    await newRoom.save();
    return res.status(201).json({ roomId: newRoom._id });
  } catch (error) {
    console.error('Private room error:', error);
    res.status(500).json({ error: 'Failed to find/create private chat' });
  }
};
