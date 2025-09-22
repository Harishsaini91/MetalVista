const Chat = require('../models/chat_group/chat');       // Your Chat mongoose model
const ChatRoom = require('../models/chat_group/chatRoom'); // Your ChatRoom mongoose model (if used)
const mongoose = require('mongoose');

module.exports = (io, sessionMiddleware) => {
  // Share session middleware with socket.io
  io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Get user info from session
    const session = socket.request.session;
    const userId = session?.userId;    // Make sure you store userId in session on login
    const userGmail = session?.gmail;  // Same for gmail

    if (!userId) {
      console.log('Unauthenticated socket connection, disconnecting');
      return socket.disconnect(true);
    }

    // Handle joining a chat room
    socket.on('join_room', (roomId) => {
      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        return console.error('Invalid roomId for join_room:', roomId);
      }
      socket.join(roomId);
      console.log(`User ${userGmail} joined room: ${roomId}`);
    });

    // Handle leaving a chat room
    socket.on('leave_room', (roomId) => {
      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        return console.error('Invalid roomId for leave_room:', roomId);
      }
      socket.leave(roomId);
      console.log(`User ${userGmail} left room: ${roomId}`);
    });

    // Handle sending messages
    socket.on('send_message', async ({ roomId, message }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(roomId)) {
          return console.error('Invalid roomId for send_message:', roomId);
        }

        if (typeof message !== 'string' || !message.trim()) {
          return console.error('Invalid message content');
        }

        // Create and save message to DB
        const chatMessage = await Chat.create({
          roomId,
          sender: userId,
          message: message.trim(),
          timestamp: new Date()
        });

        // Populate sender details (gmail)
        await chatMessage.populate('sender', 'gmail');

        // Broadcast message to other users in the room
        socket.to(roomId).emit('new_message', chatMessage);

        // Emit message back to sender for instant UI update
        socket.emit('new_message', chatMessage);

        console.log(`Message sent in room ${roomId} by ${userGmail}`);

      } catch (err) {
        console.error('Error in send_message:', err);
      }
    });

    // Optionally, handle file uploads or other socket events here

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });





 






  });
};
