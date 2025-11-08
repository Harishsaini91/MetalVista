const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user_info',
    required: true
  },
  message: {
    type: String,
    required: false
  },
  file: {
    type: String,
    required: false
  },
  fileType: {
    type: String,
    enum: ['image', 'video', 'document', 'audio', 'other'],
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Chat', chatSchema); 