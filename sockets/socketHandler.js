const Message = require('../models/Message');
const User = require('../models/User');
const Snapshot = require('../models/Snapshot');
const Room = require('../models/Room');
const webpush = require('web-push');

// We use this map to track which users are currently online globally
const onlineUsers = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    
    // When a user connects, the client emits 'register_user' with their userId
    socket.on('register_user', async (userId) => {
      socket.userId = userId;
      onlineUsers.set(userId, socket.id);
      
      // Broadcast to everyone that this user is now online
      io.emit('user_online', userId);
    });

    // Handle joining a specific chat room
    socket.on('join_room', ({ roomId }) => {
      // Leave all other rooms first (so we don't accidentally send messages to the wrong place)
      socket.rooms.forEach(room => {
        if (room !== socket.id) socket.leave(room);
      });
      // Join the new room
      socket.join(roomId);
    });

    // Handle sending a message
    socket.on('send_message', async ({ roomId, content, senderId }) => {
      try {
        // Save the message to MongoDB immediately
        const newMsg = new Message({
          roomId,
          senderId,
          content,
          type: 'text'
        });
        await newMsg.save();

        // Populate sender details before broadcasting so the frontend can display the name
        const populatedMsg = await newMsg.populate('senderId', 'username');

        // Broadcast the message ONLY to users in this specific roomId
        io.to(roomId).emit('receive_message', populatedMsg);

        // --- PUSH NOTIFICATION LOGIC ---
        // Find users in the room who are NOT online right now
        const room = await Room.findById(roomId).populate('members');
        
        for (const member of room.members) {
          // If the member is NOT in onlineUsers map, and they have a pushSubscription, push!
          if (!onlineUsers.has(member._id.toString()) && member._id.toString() !== senderId.toString()) {
            if (member.pushSubscription) {
              const payload = JSON.stringify({
                title: `New Message in ${room.name || 'Chat'}`,
                body: `${populatedMsg.senderId.username}: ${content.length > 50 ? content.substring(0, 50) + '...' : content}`,
                url: '/chat'
              });
              try {
                await webpush.sendNotification(member.pushSubscription, payload);
              } catch (err) {
                console.error('Web Push failed for user', member.username, err.message);
              }
            }
          }
        }
      } catch (error) {
        console.error('Socket Send Message Error:', error);
      }
    });

    // -----------------------------------------------------------------
    // TYPING INDICATOR LOGIC
    // -----------------------------------------------------------------
    
    // When a user starts typing, we broadcast to the room
    socket.on('typing_start', ({ roomId, username }) => {
      // We use socket.to() instead of io.to() because socket.to() 
      // sends to everyone in the room EXCEPT the sender.
      socket.to(roomId).emit('user_typing', { username, roomId });
    });

    // When a user stops typing, we broadcast the stop event
    socket.on('typing_stop', ({ roomId }) => {
      socket.to(roomId).emit('user_stopped_typing', { roomId });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('user_offline', socket.userId);
      }
    });
  });

  // --- CRON JOB FOR SNAPSHOTS ---
  // We place this here because it has immediate access to `onlineUsers` map count!
  const cron = require('node-cron');
  // Runs perfectly every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const currentOnline = onlineUsers.size;
      const snapshot = new Snapshot({
        onlineCount: currentOnline
      });
      await snapshot.save();
      console.log(`[Cron] Captured analytics snapshot: ${currentOnline} online users.`);
    } catch (error) {
      console.error('[Cron] Failed to save snapshot:', error);
    }
  });
};
