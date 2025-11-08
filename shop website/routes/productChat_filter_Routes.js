// routes/productChat_filter_Routes.js
const express = require("express");
const router = express.Router();
const ProductModelData = require("../models/ProductModelData");
const { handleAiQuery } = require("../controller/aiSearchController");
const condition = require("../condition/condition");

// POST: user prompt → AI extracts keys → backend fetch products
router.post("/ai-product-query", condition.authenticate, async (req, res) => {
  try {
    const { message, offset = 0, limit = 5 } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });

    // 1️⃣ Use AI to extract keys
    const keys = await handleAiQuery({ body: { message }, user: req.user });

    // 2️⃣ Build MongoDB query
    const queryParts = [];
    if (Array.isArray(keys.keywords) && keys.keywords.length) {
      const regex = keys.keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
      queryParts.push({ product_name: { $regex: regex, $options: "i" } });
      queryParts.push({ subnames: { $elemMatch: { $regex: regex, $options: "i" } } });
    }
    if (keys.category) queryParts.push({ "selectedFields.category": { $regex: keys.category, $options: "i" } });
    if (keys.color) queryParts.push({ "selectedFields.color": { $regex: keys.color, $options: "i" } });

    const filter = queryParts.length ? { $or: queryParts } : {};

    // 3️⃣ Fetch from DB, prioritize best matches by keyword presence
    const products = await ProductModelData.find(filter)
      .sort({ updatedAt: -1 }) // fallback sort
      .skip(offset) 
      .limit(limit) 
      .lean();  
 
    const formatted = products.map(p => ({  
      id: p._id,
      name: p.product_name,
      image: `/images/uploded_image/${p.imageName}`,
      url: `/product_details?image=${p.imageName}`
    }));

    res.json({ products, nextOffset: offset + products.length });
  } catch (err) {
    console.error("AI Product Query Error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

module.exports = router; 
 