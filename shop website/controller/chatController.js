const Chat = require('../models/chat_group/chat');
const ChatRoom = require('../models/chat_group/chatRoom');
const User = require('../models/User');
const { upload } = require('../condition/condition');
const path = require('path');
const fs = require('fs');

// Get or create chat room for user
const getOrCreateRoom = async (userId) => {
  let room = await ChatRoom.findOne({ userId });
  
  if (!room) {
    room = new ChatRoom({ userId });
    await room.save();
  }
  
  return room;
};

// Get chat history
const getChatHistory = async (req, res) => {
  try {
    const { roomId } = req.params;
    const chats = await Chat.find({ roomId })
      .sort('timestamp')
      .populate('sender', 'gmail');
      
    res.json(chats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send message
const sendMessage = async (req, res) => {
  try {
    const { roomId, message } = req.body;
    const senderId = req.user._id;
    
    const chat = new Chat({
      roomId,
      sender: senderId,
      message
    });
    
    await chat.save();
    
    // Update room's updatedAt
    await ChatRoom.findByIdAndUpdate(roomId, { updatedAt: Date.now() });
    
    // Emit to room
    req.io.to(roomId).emit('new_message', chat);
    
    res.status(201).json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload file
const uploadFile = [
  upload.single('file'),
  async (req, res) => {
    try {
      const { roomId } = req.body;
      const senderId = req.user._id;
      
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Determine file type
      const ext = path.extname(req.file.originalname).toLowerCase();
      let fileType = 'other';
      
      if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
        fileType = 'image';
      } else if (['.mp4', '.mov', '.avi', '.mkv'].includes(ext)) {
        fileType = 'video';
      } else if (['.pdf', '.doc', '.docx', '.txt'].includes(ext)) {
        fileType = 'document';
      } else if (['.mp3', '.wav', '.ogg'].includes(ext)) {
        fileType = 'audio';
      }
      
      const chat = new Chat({
        roomId,
        sender: senderId,
        file: req.file.filename,
        fileType
      });
      
      await chat.save();
      await ChatRoom.findByIdAndUpdate(roomId, { updatedAt: Date.now() });
      
      // Emit to room
      req.io.to(roomId).emit('new_message', chat);
      
      res.status(201).json(chat);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
];

// Get all rooms for admin
const getAdminRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.find({})
      .populate('userId', 'gmail')
      .sort({ updatedAt: -1 });
      
    res.render('chat/admin', { rooms });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

// Get user chat room


const getUserRoom = async (req, res) => {
  try {
    const room = await getOrCreateRoom(req.user._id);
    const chats = await Chat.find({ roomId: room._id })
      .sort('timestamp')
      .populate('sender', 'gmail');

    res.render('chat/user', { room, chats ,user: req.user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};


// Join room (admin)
const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await ChatRoom.findByIdAndUpdate(
      roomId,
      { adminId: req.user._id, status: 'active' },
      { new: true }
    ).populate('userId', 'gmail');
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    const chats = await Chat.find({ roomId })
      .sort('timestamp')
      .populate('sender', 'gmail');
      
    res.render('chat/room', { room, chats , user: req.user});
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};
  


module.exports = {
  getOrCreateRoom,
  getChatHistory,
  sendMessage,
  uploadFile,
  getAdminRooms,
  getUserRoom,
  joinRoom
};