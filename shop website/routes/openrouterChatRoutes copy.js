const express = require('express');
const router = express.Router();
const { chatWithOpenRouter, getChatHistory, getChatById, deleteChat } = require('../controller/openrouterChatController');
const condition = require('../condition/condition');
const ProductModelData = require("../models/product_model_data.js");

// --- Chat routes ---
router.get('/openrouter-chtgpt-chat', condition.authenticate, (req, res) => {
  res.render('openai_chat/openrouter_chtgpt.ejs');
});

router.post('/openrouter-chat', condition.authenticate, chatWithOpenRouter);
router.get('/openrouter-chat/history', condition.authenticate, getChatHistory);
router.get('/openrouter-chat/history/:conversationId', condition.authenticate, getChatById);
router.delete('/openrouter-chat/history/:conversationId', condition.authenticate, deleteChat);


/**
 * 🔹 POST /products/api/search-products-keys
 * Accepts JSON keys extracted from AI and returns matching products
 */
// router.post("/products/api/search-products-keys", async (req, res) => {
//   try {
//     const keys = req.body;

//     if (!keys || Object.keys(keys).length === 0) {
//       return res.status(400).json({ error: "No keys provided" });
//     }

//     console.log("🔑 Keys received:", keys);

//     const searchConditions = [];

//     // ✅ Search by keywords array
//     if (Array.isArray(keys.keywords) && keys.keywords.length > 0) {
//       keys.keywords.forEach(kw => {
//         if (kw && kw.trim() !== "") {
//           const regex = new RegExp(kw.trim(), "i");
//           searchConditions.push({ product_name: regex });
//           searchConditions.push({ imageName: regex });
//           searchConditions.push({ subnames: { $elemMatch: regex } });
//         }
//       });
//     }

//     // ✅ Search by structured fields
//     ["category", "material", "color", "capacity", "weight", "surface"].forEach(field => {
//       if (keys[field]) {
//         if (Array.isArray(keys[field])) {
//           keys[field].forEach(val => {
//             if (val && val.trim() !== "") {
//               searchConditions.push({ [`selectedFields.${field}`]: new RegExp(val.trim(), "i") });
//             }
//           });
//         } else if (typeof keys[field] === "string" && keys[field].trim() !== "") {
//           searchConditions.push({ [`selectedFields.${field}`]: new RegExp(keys[field].trim(), "i") });
//         }
//       }
//     });

//     // ✅ Fetch products matching any of the conditions
//     const matches = searchConditions.length
//       ? await ProductModelData.find({ $or: searchConditions })
//       : [];

//     const formatted = matches.map(p => ({
//       id: p._id,
//       product_name: p.product_name,
//       imageUrl: `/images/uploded_image/${p.imageName}`,
//       imageName: p.imageName,
//     }));

//     console.log("📦 Products fetched by keys:", formatted.length);
//     res.json(formatted);

//   } catch (err) {
//     console.error("❌ Product search error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// 🔍 Search products using AI-extracted keywords and selected fields
router.post("/products/api/search-products-keys", async (req, res) => {
  try {
    const { keywords = [], category, material, color, weight, capacity, surface } = req.body || {};

    // ✅ Ensure keywords are always an array
    const cleanKeywords = Array.isArray(keywords)
      ? keywords.filter(k => typeof k === "string" && k.trim() !== "")
      : [];

    if (cleanKeywords.length === 0 && !category && !material && !color && !weight && !capacity && !surface) {
      return res.json([]); // nothing to search
    }
 
    // --- Build dynamic search filters ---
    const orConditions = [];

    // 🔸 Add keyword-based search across multiple text fields
    cleanKeywords.forEach(keyword => {
      const kw = keyword.toLowerCase();
      orConditions.push(
        { product_name: { $regex: kw, $options: "i" } },
        { imageName: { $regex: kw, $options: "i" } },
        { subnames: { $elemMatch: { $regex: kw, $options: "i" } } },
        { "selectedFields.category": { $regex: kw, $options: "i" } },
        { "selectedFields.brand": { $regex: kw, $options: "i" } },
        { "selectedFields.type": { $regex: kw, $options: "i" } },
        { "selectedFields.material": { $regex: kw, $options: "i" } },
        { "selectedFields.color": { $regex: kw, $options: "i" } },
        { "selectedFields.weight": { $regex: kw, $options: "i" } },
        { "selectedFields.surface": { $regex: kw, $options: "i" } },
        { "selectedFields.usage": { $regex: kw, $options: "i" } },
        { "selectedFields.servicesIncluded": { $regex: kw, $options: "i" } },
        { "selectedFields.style": { $regex: kw, $options: "i" } }
      );
    });

    // 🔸 Additional filters from AI JSON (optional)
    const andConditions = [];

    if (category) andConditions.push({ "selectedFields.category": { $regex: category, $options: "i" } });
    if (material) andConditions.push({ "selectedFields.material": { $regex: material, $options: "i" } });
    if (Array.isArray(color) && color.length > 0)
      andConditions.push({ "selectedFields.color": { $in: color.map(c => new RegExp(c, "i")) } });
    if (weight) andConditions.push({ "selectedFields.weight": { $regex: weight, $options: "i" } });
    if (capacity) andConditions.push({ "selectedFields.capacity": { $regex: capacity, $options: "i" } });
    if (surface) andConditions.push({ "selectedFields.surface": { $regex: surface, $options: "i" } });

    // --- Combine search logic ---
    const query = {};
    if (orConditions.length > 0) query.$or = orConditions;
    if (andConditions.length > 0) query.$and = andConditions;

    // --- Fetch matching products ---
    const results = await ProductModelData.find(query).limit(40);

    // --- Format result for frontend ---
    const formatted = results.map(p => ({
      id: p._id,
      product_name: p.product_name,
      imageUrl: `/images/uploded_image/${p.imageName}`,
      imageName: p.imageName
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ Keyword search error:", err);
    res.status(500).json({ error: "Server error during keyword search" });
  }
});
 

module.exports = router;
  