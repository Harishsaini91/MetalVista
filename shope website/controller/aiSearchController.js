const axios = require("axios");
const ProductModelData = require("../models/product_model_data");
const Order = require("../models/payment/Order");
require("dotenv").config();

/* ============================================================
   🧠 GLOBAL AI CONFIGURATION
   ============================================================ */

const AI_MODEL = "openai/gpt-4o-mini";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_TOKENS = 400;

/**
 * System prompt ensures consistent, structured AI output.
 */
const SYSTEM_PROMPT = `
You are not a chatbot or a conversational model.  
You are a strict AI keyword extractor and normalizer.

Your job:
- Read the user's sentence.
- Auto-correct minor spelling or grammar mistakes.
- Identify and return only the words that match or closely relate to the following schema vocabulary list.
- Always return them in lowercase, separated by "|" and ending with a single "|".
- Never write anything else — no text, no JSON, no comments, no explanations.

====================================================
📦 PRODUCT SCHEMA REFERENCE
====================================================
household, custom, outdoor, furniture, transport vehicle, modified, stole, food trolley
wood, iron, steel, mirror, aluminium
white, natural wood, brown, green, blue, red, grey, silver, black
lightweight, medium, heavy duty
6 persons, 4 persons, 2 persons, 1 person, 1000kg, 500kg, 200kg, 100kg, 50kg
polished, painted, powder coated, anti-slip, glossy finish, matte finish, mirror finish, rough / textured, smooth, plain
foldable, unfoldable
outdoor, indoor
25,000+, 10,000–25,000, 5,000–10,000, 1,000–5,000, under 1,000
modified / refurbished, new
custom design support, installation, maintenance, home delivery
rustic, classic, modern
5 wheels, 4 wheels, 3 wheels, 2 wheels
====================================================

⚙️ STRICT RULES:
- Output format: word|word|word|
- Correct misspelled words (e.g., "steal" → "steel", "miror" → "mirror", "modarn" → "modern", "furnture" → "furniture").
- Ignore filler words like: show, find, want, give, please, me, any, look, for, need, buy, price, get, tell, display, search.
- If multiple schema words are relevant, include them all.
- Always use singular forms (e.g., "chairs" → "chair", "tables" → "table").
- Never duplicate words.
- Always end with one "|".
- If no schema matches, return "none|".

====================================================
🧩 EXAMPLES
====================================================

User: "I want a red wooden outdoor chair"
Assistant: red|wood|outdoor|chair|

User: "Show me a foldable steel food trolley"
Assistant: foldable|steel|food|trolley|

User: "Looking for polished brown furniture for 4 persons"
Assistant: polished|brown|furniture|4person|

User: "New mirror finish stool with wheels"
Assistant: new|mirror|finish|stool|wheels|

User: "Give me a blue stole made of almunium for outdoor use"
Assistant: blue|stole|aluminium|outdoor|

User: "Find modarn wooden table with 4 wheelz"
Assistant: modern|wood|table|4wheels|

User: "Show food trolly made of steal"
Assistant: food|trolley|steel|

User: "Any red furnture for outdor?"
Assistant: red|furniture|outdoor|

User: "i wnt polised surfce mirror stole"
Assistant: polished|mirror|stole|

User: "Need foldbel brown table with silver color"
Assistant: foldable|brown|table|silver|

User: "I am Harish"
Assistant: i|am|harish|
`;







/* ============================================================
   🧩 AI CALL + PARSING HELPERS
   ============================================================ */

async function callOpenRouter(prompt, schema) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Schema reference:\n${JSON.stringify(schema.fields.map(f => ({ name: f.name, values: f.values })), null, 2)}\n\nUser Query: ${prompt}` },
  ];

  const res = await axios.post(
    API_URL,
    {
      model: AI_MODEL,
      messages,
      max_tokens: MAX_TOKENS,
      temperature: 0.4,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 20000,
    }
  );

  return res.data.choices?.[0]?.message?.content?.trim() || "{}";
}

function safeParseJSON(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/```json([\s\S]*?)```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]
          .replace(/[\u201C\u201D]/g, '"')
          .replace(/,(\s*})/g, "$1")
          .trim());
      } catch {
        return null;
      }
    }
    const fallback = text.match(/\{[\s\S]*\}/);
    if (fallback) {
      try {
        return JSON.parse(fallback[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function maskOrderId(orderId) {
  if (!orderId) return "";
  if (orderId.length <= 6) return "*".repeat(orderId.length);
  return orderId.slice(0, 4) + "***" + orderId.slice(-2);
}

/* ============================================================
   🚀 MAIN CONTROLLER
   ============================================================ */

exports.handleAiQuery   = async (req, res) => {
  try {
    const userPrompt = req.body.prompt || req.body.message || "";
    const schema = req.body.schema || null;
    if (!userPrompt) return res.status(400).json({ error: "No prompt provided." });

    console.log(`\n🗣️ User Prompt: "${userPrompt}"`);

    // 1️⃣ Query AI
    const aiRaw = await callOpenRouter(userPrompt, schema || { fields: [] });
    console.log("🤖 Raw AI Output:", aiRaw.slice(0, 200) + "...");

    // 2️⃣ Extract friendly message and structured keys
    const friendlyText = aiRaw.split("```json")[0].trim();
    const parsedKeys = safeParseJSON(aiRaw) || {};

    if (!parsedKeys.intent) parsedKeys.intent = "search_product";
    if (!Array.isArray(parsedKeys.keywords)) parsedKeys.keywords = [];

    console.log("🧠 Parsed Keys:", JSON.stringify(parsedKeys, null, 2));

    /* ============================================================
       3️⃣ ORDER SEARCH
       ============================================================ */
    if (parsedKeys.intent === "search_order") {
      if (!req.user) return res.status(401).json({ error: "Login required." });

      const limit = parsedKeys.limit || 5;
      const filter = { user: req.user._id };

      if (parsedKeys.order_custid)
        filter.orderId = { $regex: parsedKeys.order_custid, $options: "i" };

      if (parsedKeys.date_range?.from || parsedKeys.date_range?.to) {
        filter.createdAt = {};
        if (parsedKeys.date_range.from)
          filter.createdAt.$gte = new Date(parsedKeys.date_range.from);
        if (parsedKeys.date_range.to)
          filter.createdAt.$lte = new Date(parsedKeys.date_range.to);
      }

 const orders = await Order.find(filter).limit(limit).lean();
const safeOrders = orders.map(o => ({
  order_custid: maskOrderId(o.orderId),
  status: o.status,
  totalAmount: o.totalAmount,
  createdAt: o.createdAt,
  products: (o.products || []).slice(0, 5).map(p => ({
    product: p.product,
    quantity: p.quantity,
    price: p.price,
  })),
}));

// 🧠 Make readable key summary
let keySummary = [];
for (const [k, v] of Object.entries(parsedKeys)) {
  if (v && v !== "" && !(Array.isArray(v) && v.length === 0)) {
    keySummary.push(`${k}: ${Array.isArray(v) ? v.join(", ") : v}`);
  }
}

const readableKeys = keySummary.length
  ? `\n\n🗝️ Detected keys → ${keySummary.join(" | ")}`
  : "\n\n⚠️ No structured keys detected.";

return res.json({
  reply: (friendlyText || "Here are your order details:") + readableKeys,
  results: safeOrders,
});

    }

    /* ============================================================
       4️⃣ INFO REPLY
       ============================================================ */
    if (parsedKeys.intent === "info") {
      return res.json({
        reply:
          friendlyText ||
          "I can help you find products, suggest designs, or track your orders.",
        keys: parsedKeys,
        results: [],
      });
    }

    /* ============================================================
       5️⃣ PRODUCT SEARCH LOGIC
       ============================================================ */
    const orConditions = [];
    const andConditions = [];

    // Keywords
    (parsedKeys.keywords || []).forEach(kw => {
      const regex = new RegExp(kw, "i");
      orConditions.push(
        { product_name: regex },
        { imageName: regex },
        { subnames: { $elemMatch: regex } },
        { "selectedFields.material": regex },
        { "selectedFields.color": regex },
        { "selectedFields.surface": regex },
        { "selectedFields.style": regex }
      );
    });

    // Structured fields
    const addCond = (f, v) => {
      if (!v) return;
      if (Array.isArray(v))
        andConditions.push({ [`selectedFields.${f}`]: { $in: v.map(x => new RegExp(x, "i")) } });
      else
        andConditions.push({ [`selectedFields.${f}`]: new RegExp(v, "i") });
    };

    addCond("category", parsedKeys.category);
    addCond("material", parsedKeys.material);
    addCond("color", parsedKeys.color);
    addCond("surface", parsedKeys.surface);
    addCond("usage", parsedKeys.usage);
    addCond("foldable", parsedKeys.foldable);
    addCond("style", parsedKeys.style);
    addCond("wheels", parsedKeys.wheels);
    addCond("price", parsedKeys.price);
    addCond("isNew", parsedKeys.isNew);

    const query = {};
    if (orConditions.length) query.$or = orConditions;
    if (andConditions.length) query.$and = andConditions;

    console.log("🧩 Mongo Query:", JSON.stringify(query, null, 2));

    const products = await ProductModelData.find(query)
      .limit(parsedKeys.limit || 5)
      .select("product_name imageName selectedFields subnames")
      .lean();

    const results = products.map(p => ({
      id: p._id,
      name: p.product_name,
      image: p.imageName ? `/images/uploded_image/${p.imageName}` : "",
      price: p.selectedFields?.price || null,
      category: p.selectedFields?.category || "",
      link: `/products/${p._id}`,
    }));

    res.json({
      reply: friendlyText || "Here are some matching products:",
      keys: parsedKeys,
      results,
    });
  } catch (err) {
    console.error("❌ AI Search Error:", err.response?.data || err.message || err);
    res.status(500).json({ error: "AI search failed. Please try again later." });
  }
};
