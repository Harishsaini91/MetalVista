// controllers/openrouterChatController.js
const ChatConversation = require('../models/AI_chat/ChatConversation');
const ProductModelSchema = require('../models/productModelSchema');
const ProductModelData = require('../models/product_model_data');
const axios = require('axios');
require('dotenv').config();

/* ============================================================
   🧠 SYSTEM PROMPT — Friendly, Smart, Schema-Aware
   ============================================================ */
const SYSTEM_PROMPT = `
You are a friendly, smart AI shopping assistant.

Your job:
1️⃣ Understand what the user wants (product, material, design, or order info).
2️⃣ Improve and correct their request naturally.
3️⃣ Respond with a short (1–2 line) friendly message.
4️⃣ Then output ONLY a valid JSON object, enclosed in triple backticks like this:

\`\`\`json
{
  "intent": "search_product",
  "keywords": ["wood", "trolley", "outdoor"],
  "category": "Outdoor",
  "material": "Wood",
  "color": ["Red", "Brown"],
  "surface": "Polished",
  "usage": "Outdoor",
  "limit": 5
}
\`\`\`

Rules:
- Always include related terms found in schema.
- JSON must be valid: no comments, no extra text after it.
- Never output anything after the JSON block.
- Keep replies short, human-like, and relevant to the product context.
`;

/* ============================================================
   🔹 Helper: AI Request with Schema + Context Memory
   ============================================================ */
async function callOpenRouterAI(prompt, schema, memory = []) {
  try {
    const schemaText = schema?.fields
      ? schema.fields.map(f => `${f.name}: ${f.values.join(', ')}`).join('\n')
      : "Schema unavailable";

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...memory.map(m => ({ role: m.role, content: m.content })),
      {
        role: "user",
        content: `Here is the product schema:\n${schemaText}\n\nUser Query: "${prompt}"`
      }
    ];

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages,
        temperature: 0.5,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 25000,
      }
    );

    return response.data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error("❌ OpenRouter API Error:", err.response?.data || err.message);
    return null;
  }
}

/* ============================================================
   🔹 Safe JSON Parsing
   ============================================================ */
function parseAIJson(text) {
  if (!text) return { keywords: [] };
  try {
    const match = text.match(/```json([\s\S]*?)```/);
    if (match && match[1]) {
      const clean = match[1]
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/,(\s*})/g, "$1")
        .trim();
      return JSON.parse(clean);
    }
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) return JSON.parse(braceMatch[0]);
  } catch (err) {
    console.warn("⚠️ Failed to parse JSON:", err.message);
  }
  return { keywords: [] };
}

/* ============================================================
   🔹 Smart Fallback: Fill Missing Keys from Schema
   ============================================================ */
function inferMissingKeys(jsonKeys, schema) {
  if (!schema?.fields) return jsonKeys;
  const lowerSchema = schema.fields.map(f => ({
    name: f.name.toLowerCase(),
    values: f.values.map(v => v.toLowerCase())
  }));

  // Convert input to lowercase for better matching
  const allText = JSON.stringify(jsonKeys).toLowerCase();

  for (const field of lowerSchema) {
    const found = field.values.find(v => allText.includes(v));
    if (found && !jsonKeys[field.name]) {
      jsonKeys[field.name] = found;
    }
  }

  // Add missing keywords from schema
  if (Array.isArray(jsonKeys.keywords)) {
    for (const field of lowerSchema) {
      for (const val of field.values) {
        if (allText.includes(val) && !jsonKeys.keywords.includes(val)) {
          jsonKeys.keywords.push(val);
        }
      }
    }
  }

  return jsonKeys;
}

/* ============================================================
   🔹 Save Chat
   ============================================================ */
async function saveChat(userId, conversationId, userMsg, aiMsg) {
  let chat = await ChatConversation.findOne({ userId, conversationId });
  if (!chat) {
    chat = new ChatConversation({
      userId,
      conversationId,
      title: userMsg.slice(0, 40),
      messages: [],
    });
  }

  chat.messages.push({ role: "user", content: userMsg });
  chat.messages.push({ role: "assistant", content: aiMsg });
  chat.updatedAt = new Date();
  await chat.save();
}

/* ============================================================
   🔹 POST /openrouter-chat
   ============================================================ */
exports.chatWithOpenRouter = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Login required" });

    const { prompt, conversationId } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const convId = conversationId || `conv_${Date.now()}`;

    // 🧠 Memory (last few messages)
    const memory = [];
    const prevChat = await ChatConversation.findOne({ userId: user._id, conversationId: convId }).lean();
    if (prevChat?.messages?.length) {
      memory.push(...prevChat.messages.slice(-6));
    }

    // 📘 Load product schema
    const schema = await ProductModelSchema.findOne().lean();

    // 🤖 Call AI
    let aiReply = await callOpenRouterAI(prompt, schema, memory);
    if (!aiReply) aiReply = "Please ask something about a product or its design.";

    // 🧩 Extract JSON
    let jsonKeys = parseAIJson(aiReply);
    if (!Array.isArray(jsonKeys.keywords)) jsonKeys.keywords = [];

    // 🧠 Infer missing keys from schema
    jsonKeys = inferMissingKeys(jsonKeys, schema);

    // 💬 Friendly text
    const friendlyReply = aiReply.replace(/```json[\s\S]*?```/, "").trim() || "Got it!";

    // 💾 Save chat
    await saveChat(user._id, convId, prompt, friendlyReply);

    res.json({
      reply: friendlyReply,
      extractedKeys: jsonKeys,
      conversationId: convId,
    });

  } catch (err) {
    console.error("🚨 Chat Error:", err.message || err);
    res.status(500).json({
      reply: "⚠️ Sorry, something went wrong. Please try again.",
      conversationId: req.body.conversationId || `conv_${Date.now()}`,
    });
  }
};

/* ============================================================
   🔹 GET /openrouter-chat/history
   ============================================================ */
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "Login required" });

    const chats = await ChatConversation.find({ userId })
      .select("conversationId title updatedAt")
      .sort({ updatedAt: -1 })
      .lean();

    res.json(chats);
  } catch (err) {
    console.error("❌ History Error:", err.message);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
};

/* ============================================================
   🔹 GET /openrouter-chat/history/:conversationId
   ============================================================ */
exports.getChatById = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "Login required" });

    const { conversationId } = req.params;
    const chat = await ChatConversation.findOne({ userId, conversationId }).lean();
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    res.json({ messages: chat.messages });
  } catch (err) {
    console.error("❌ Chat Fetch Error:", err.message);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
};

/* ============================================================
   🔹 DELETE /openrouter-chat/:conversationId
   ============================================================ */
exports.deleteChat = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "Login required" });

    const { conversationId } = req.params;
    const result = await ChatConversation.findOneAndDelete({ userId, conversationId });
    if (!result) return res.status(404).json({ error: "Chat not found" });

    res.json({ success: true, message: "Chat deleted successfully" });
  } catch (err) {
    console.error("❌ Delete Error:", err.message);
    res.status(500).json({ error: "Failed to delete chat" });
  }
};
