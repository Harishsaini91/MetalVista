const express = require('express');
const router = express.Router();
const { chatWithOpenRouter } = require('../controller/openrouter_chtgptController');

router.get('/openrouter-chtgpt-chat', (req, res) => {
  res.render('openai_chat/openrouter_chtgpt');
});

router.post('/openrouter-chtgpt', chatWithOpenRouter);

module.exports = router;
