// controllers/chatSaveController.js
const ChatConversation = require('../models/AI_chat/ChatConversation');
const axios = require('axios');
require('dotenv').config();

/**
 * Save user message + AI response
 */
async function saveChat(userId, conversationId, userMessage) {
  try {
    // Call OpenRouter API
    const aiResp = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: userMessage }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiMessage = aiResp.data.choices?.[0]?.message?.content || '';

    // Save to DB
    let chat = await ChatConversation.findOne({ userId, conversationId });
    if (!chat) {
      chat = new ChatConversation({ userId, conversationId, messages: [] });
    }

    chat.messages.push({ role: 'user', content: userMessage });
    chat.messages.push({ role: 'assistant', content: aiMessage });

    await chat.save();
    return aiMessage;

  } catch (err) {
    console.error('Chat Save Error:', err.response?.data || err.message);
    throw new Error('AI chat failed');
  }
}

module.exports = { saveChat };
