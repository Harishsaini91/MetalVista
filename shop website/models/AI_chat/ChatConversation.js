const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const chatConversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user_info',
    required: true,
    index: true
  },
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Chat' // helpful when displaying chat list (like ChatGPT)
  },
  messages: {
    type: [messageSchema],
    default: []
  },
  metadata: {
    model: { type: String, default: 'openai/gpt-4o-mini' },
    totalTokens: { type: Number, default: 0 },
    sessionData: { type: Object, default: {} }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: '5d' } // auto-delete after 5 days
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// update timestamp on save
chatConversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// simple static methods for convenience
chatConversationSchema.statics.getUserChats = function(userId) {
  return this.find({ userId })
    .select('conversationId title updatedAt')
    .sort({ updatedAt: -1 });
};

chatConversationSchema.statics.getChatMessages = function(userId, conversationId) {
  return this.findOne({ userId, conversationId }).select('messages');
};

module.exports = mongoose.model('ChatConversation', chatConversationSchema);
 