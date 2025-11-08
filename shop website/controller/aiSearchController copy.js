const axios = require('axios');
const ProductModelData = require('../models/product_model_data');
const Order = require('../models/payment/Order');
require('dotenv').config();

const SYSTEM_PROMPT = `
You are an assistant that converts a user's natural language request into a JSON of search keys for a product/order database.
Output ONLY valid JSON with these fields when applicable:
{
  "intent": "search_product" | "search_order" | "info",
  "keywords": ["..."],
  "category": "...",
  "color": "...",
  "customDesign": true|false,
  "modified": true|false,
  "order_custid": "...",
  "date_range": { "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" },
  "limit": 5
}
Rules:
- Only include fields relevant to the user's query.
- Do NOT invent database field names other than the keys above.
- Do not include or request any user's private data (emails, raw IDs).
- If the user asks about their own orders, the backend will enforce filtering by authenticated user.
`;

async function callOpenRouterForKeys(prompt) {
  const resp = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `User Query: ${prompt}` }
      ],
      max_tokens: 400
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    }
  );

  return resp.data.choices?.[0]?.message?.content || '{}';
}

function safeParseJSON(maybeJson) {
  try {
    return JSON.parse(maybeJson);
  } catch {
    const match = maybeJson.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { return null; }
    }
    return null;
  }
}

function maskOrderId(orderId) {
  if (!orderId) return '';
  if (orderId.length <= 6) return '*'.repeat(orderId.length);
  return orderId.slice(0, 4) + '***' + orderId.slice(-2);
}

exports.handleAiQuery = async (req, res) => {
  try {
    const message = req.body.message || req.body.prompt || req.body.query;
    if (!message) return res.status(400).json({ error: 'No message provided' });

    // 1️⃣ Get structured keys from AI
    const aiRaw = await callOpenRouterForKeys(message);
    const keys = safeParseJSON(aiRaw) || {};
    if (!keys.intent) keys.intent = 'search_product';

    console.log('🧠 AI Keys:', JSON.stringify(keys, null, 2));
    const limit = keys.limit || 5;

    // 2️⃣ Handle order searches (secure)
    if (keys.intent === 'search_order') {
      if (!req.user) return res.status(401).json({ error: 'Login required' });

      const filter = { user: req.user._id };
      if (keys.order_custid)
        filter.orderId = { $regex: keys.order_custid, $options: 'i' };

      if (keys.date_range?.from || keys.date_range?.to) {
        filter.createdAt = {};
        if (keys.date_range.from)
          filter.createdAt.$gte = new Date(keys.date_range.from);
        if (keys.date_range.to)
          filter.createdAt.$lte = new Date(keys.date_range.to);
      }

      const orders = await Order.find(filter).limit(limit).lean();
      const safe = orders.map(o => ({
        order_custid: maskOrderId(o.orderId),
        status: o.status,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt,
        products: (o.products || []).slice(0, 5).map(p => ({
          product: p.product,
          quantity: p.quantity,
          price: p.price
        }))
      }));
      return res.json({ intent: 'search_order', keys, results: safe });
    }

    // 3️⃣ Handle info-only queries
    if (keys.intent === 'info') {
      return res.json({
        message: 'I can help you search for products, track orders, or find items by color, design, or modification.'
      });
    }

    // 4️⃣ Product search logic
    const qParts = [];
    const orParts = [];

    if (Array.isArray(keys.keywords) && keys.keywords.length) {
      const escaped = keys.keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      orParts.push({ product_name: { $regex: escaped, $options: 'i' } });
      orParts.push({ subnames: { $elemMatch: { $regex: escaped, $options: 'i' } } });
      orParts.push({ category: { $regex: escaped, $options: 'i' } });
    }

    if (orParts.length) qParts.push({ $or: orParts });
    if (keys.category) qParts.push({ category: { $regex: keys.category, $options: 'i' } });

    if (keys.color) {
      qParts.push({
        $or: [
          { 'selectedFields.color': { $regex: keys.color, $options: 'i' } },
          { 'selectedFields.Color': { $regex: keys.color, $options: 'i' } }
        ]
      });
    }

    if (keys.customDesign) qParts.push({ 'selectedFields.customDesign': { $in: ['true', true, 'True'] } });
    if (keys.modified) qParts.push({ 'selectedFields.modified': { $in: ['true', true, 'True'] } });

    const filter = qParts.length ? { $and: qParts } : {};
    const products = await ProductModelData.find(filter)
      .select('product_name imageName subnames selectedFields')
      .limit(limit)
      .lean();

    const results = products.map(p => ({
      id: p._id,
      name: p.product_name,
      image: p.imageName ? `/uploads/${p.imageName}` : (p.selectedFields?.image || ''),
      price: p.selectedFields?.price || null,
      link: `/products/${p._id}`
    }));

    res.json({ intent: 'search_product', keys, results });

  } catch (err) {
    console.error('AI Search Error:', err.response?.data || err.message || err);
    res.status(500).json({ error: 'AI search failed' });
  }
};
