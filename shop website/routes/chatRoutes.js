const express = require('express');
const router = express.Router();
const chatController = require('../controller/chatController');
const { authenticate, roleCheck } = require('../condition/condition');

// User routes
router.get('/user/chat', authenticate, chatController.getUserRoom);
router.get('/api/chat/:roomId/history', authenticate, chatController.getChatHistory);
router.post('/api/chat/send', authenticate, chatController.sendMessage);
router.post('/api/chat/upload', authenticate, chatController.uploadFile);

// Admin routes
router.get('/admin/chat', authenticate, roleCheck('admin'), chatController.getAdminRooms);
router.get('/admin/chat/:roomId', authenticate, roleCheck('admin'), chatController.joinRoom);

 
module.exports = router;