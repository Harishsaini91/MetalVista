// controllers/openrouterChatController.js
const ChatConversation = require('../models/AI_chat/ChatConversation');
const axios = require('axios');
require('dotenv').config();

/**
 * 🔹 Helper: Call OpenRouter API safely
 */
async function callOpenRouterAPI(boundedPrompt) {
  try {
    const aiResp = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful AI shop assistant.' },
          { role: 'user', content: boundedPrompt }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return aiResp.data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error('❌ OpenRouter API Error:', err.response?.data || err.message);
    return null;
  }
}

/**
 * 🔹 Save user + AI messages in conversation
 */
async function saveChat(userId, conversationId, userMessage, aiMessage) {
  let chat = await ChatConversation.findOne({ userId, conversationId });

  if (!chat) {
    chat = new ChatConversation({
      userId,
      conversationId,
      title: userMessage.slice(0, 40),
      messages: []
    });
  }

  chat.messages.push({ role: 'user', content: userMessage });
  chat.messages.push({ role: 'assistant', content: aiMessage });
  chat.updatedAt = new Date();

  await chat.save();
}

/**
 * 🔹 POST /openrouter-chat
 */
exports.chatWithOpenRouter = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Login required' });

    const { prompt, boundedPrompt, schema, conversationId } = req.body;
    if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

    const convId = conversationId || `conv_${Date.now()}`;

    // 1️⃣ Call AI using bounded prompt
    let aiReply = await callOpenRouterAPI(boundedPrompt);

    // Fallback if AI fails or gives unrelated topic
    if (!aiReply || aiReply.toLowerCase().includes('please ask')) {
      aiReply = "Please ask something related to shop or metal/wood design.";
    }

    // 2️⃣ Extract JSON block safely
    let extractedKeys = {};
    const match = aiReply.match(/```json([\s\S]*?)```/);

    if (match && match[1]) {
      try {
        const cleanJSON = match[1]
          .replace(/[\u201C\u201D]/g, '"')   // fix smart quotes
          .replace(/,(\s*})/g, '$1')        // remove trailing commas
          .trim();
        extractedKeys = JSON.parse(cleanJSON);
      } catch (err) {
        console.log("⚠️ Failed to parse AI JSON:", err.message);
        extractedKeys = {};
      }
    } else {
      console.log("⚠️ No JSON block found in AI reply");
    }

    // Ensure keywords array exists
    if (!Array.isArray(extractedKeys.keywords)) {
      extractedKeys.keywords = [];
    }

    // 3️⃣ Separate human-readable reply
    const humanReply = aiReply.replace(/```json[\s\S]*?```/, '').trim() || "Got it!";

    // 4️⃣ Save chat to DB
    await saveChat(user._id, convId, prompt, humanReply);

    // 5️⃣ Respond to frontend
    res.json({
      reply: humanReply,
      extractedKeys,
      conversationId: convId
    });

  } catch (err) {
    console.error('🚨 OpenRouter Chat Error:', err.message || err);
    res.status(500).json({
      reply: "⚠️ Sorry, I couldn’t process that. Please ask something related to the shop or materials.",
      conversationId: req.body.conversationId || `conv_${Date.now()}`
    });
  }
};

/**
 * 🔹 GET /openrouter-chat/history
 */
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Login required' });

    const chats = await ChatConversation.find({ userId })
      .select('conversationId title updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    res.json(chats);
  } catch (err) {
    console.error('❌ History Fetch Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};

/**
 * 🔹 GET /openrouter-chat/history/:conversationId
 */
exports.getChatById = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Login required' });

    const { conversationId } = req.params;
    const chat = await ChatConversation.findOne({ userId, conversationId }).lean();

    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json({ messages: chat.messages });
  } catch (err) {
    console.error('❌ Chat Fetch Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
};

/**
 * 🔹 DELETE /openrouter-chat/:conversationId
 */
exports.deleteChat = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Login required' });

    const { conversationId } = req.params;
    const result = await ChatConversation.findOneAndDelete({ userId, conversationId });

    if (!result) return res.status(404).json({ error: 'Chat not found' });
    res.json({ success: true, message: 'Chat deleted successfully' });
  } catch (err) {
    console.error('❌ Delete Chat Error:', err.message);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
};
