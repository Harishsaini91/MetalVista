const express = require("express");
const router = express.Router();
const {
  chatWithOpenRouter,
  getChatHistory,
  getChatById,
  deleteChat
} = require("../controller/openrouterChatController");
const condition = require("../condition/condition");
const ProductModelData = require("../models/product_model_data.js");

/* ============================================================
   🧠 CHAT ROUTES (AI Assistant Interface)
   ============================================================ */
router.get("/openrouter-chtgpt-chat", condition.authenticate, (req, res) => {
  res.render("openai_chat/openrouter_chtgpt.ejs");
});

router.post("/openrouter-chat", condition.authenticate, chatWithOpenRouter);
router.get("/openrouter-chat/history", condition.authenticate, getChatHistory);
router.get("/openrouter-chat/history/:conversationId", condition.authenticate, getChatById);
router.delete("/openrouter-chat/history/:conversationId", condition.authenticate, deleteChat);

/* ============================================================
   🔍 PRODUCT SEARCH BY AI-EXTRACTED KEYS
   ============================================================ */
router.post("/products/api/search-products-keys", async (req, res) => {
  try {
    const ProductModelSchema = require("../models/product_model_schema");
    const ProductModelData = require("../models/product_model_data");

    const {
      keywords = [],
      category,
      material,
      color,
      weight,
      capacity,
      surface,
      usage,
      foldable,
      style,
      wheels,
      price,
      isNew,
    } = req.body || {};

    // ✅ Normalize keywords
    const cleanKeywords = Array.isArray(keywords)
      ? keywords
          .map(k => k.trim())
          .filter(k => typeof k === "string" && k.length > 0)
      : [];

    // ✅ Return empty if no search input
    if (
      cleanKeywords.length === 0 &&
      !category &&
      !material &&
      !color &&
      !weight &&
      !capacity &&
      !surface &&
      !usage &&
      !foldable &&
      !style &&
      !wheels &&
      !price &&
      !isNew
    ) {
      return res.json([]);
    }

    /* ============================================================
       STEP 1️⃣ — LOAD PRODUCT SCHEMA (for field awareness)
       ============================================================ */
    const schema = await ProductModelSchema.findOne().lean();
    const schemaFieldNames = schema?.fields?.map(f => f.name) || [];

    /* ============================================================
       STEP 2️⃣ — BUILD SEARCH FILTERS
       ============================================================ */
    const orConditions = [];

    // 🧠 Add keyword-based fuzzy search
    cleanKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, "i");
      orConditions.push(
        { product_name: regex },
        { imageName: regex },
        { subnames: { $elemMatch: regex } },
        ...schemaFieldNames.map(field => ({
          [`selectedFields.${field}`]: regex
        }))
      );
    });

    const andConditions = [];

    // 🧩 Helper to add structured fields
    const addRegexCondition = (field, value) => {
      if (!value) return;
      if (Array.isArray(value) && value.length > 0) {
        andConditions.push({
          [`selectedFields.${field}`]: { $in: value.map(v => new RegExp(v, "i")) },
        });
      } else if (typeof value === "string" && value.trim() !== "") {
        andConditions.push({
          [`selectedFields.${field}`]: new RegExp(value.trim(), "i"),
        });
      }
    };

    // Add all structured conditions
    addRegexCondition("category", category);
    addRegexCondition("material", material);
    addRegexCondition("color", color);
    addRegexCondition("weight", weight);
    addRegexCondition("capacity", capacity);
    addRegexCondition("surface", surface);
    addRegexCondition("usage", usage);
    addRegexCondition("foldable", foldable);
    addRegexCondition("style", style);
    addRegexCondition("wheels", wheels);
    addRegexCondition("price", price);
    addRegexCondition("isNew", isNew);

    /* ============================================================
       STEP 3️⃣ — COMBINE INTO FINAL QUERY
       ============================================================ */
    const query = {};
    if (orConditions.length > 0) query.$or = orConditions;
    if (andConditions.length > 0) query.$and = andConditions;

    console.log("🔍 Search Query:", JSON.stringify(query, null, 2));

    /* ============================================================
       STEP 4️⃣ — EXECUTE SEARCH
       ============================================================ */
    const results = await ProductModelData.find(query)
      .limit(50)
      .select("product_name imageName selectedFields subnames")
      .lean();

    /* ============================================================
       STEP 5️⃣ — FORMAT RESULTS
       ============================================================ */
    const formatted = results.map(p => ({
      id: p._id,
      product_name: p.product_name,
      imageUrl: `/images/uploded_image/${p.imageName}`,
      imageName: p.imageName,
      details: p.selectedFields || {},
      tags: p.subnames || [],
    }));

    console.log(`📦 ${formatted.length} product(s) matched`);

    /* ============================================================
       STEP 6️⃣ — SMART FALLBACK (optional)
       ============================================================ */
    if (formatted.length === 0 && cleanKeywords.length > 0) {
      console.log("⚙️ Running fallback search (broader match)...");
      const fallback = await ProductModelData.find({
        $or: [
          { product_name: { $regex: cleanKeywords.join("|"), $options: "i" } },
          { "selectedFields.category": { $regex: cleanKeywords.join("|"), $options: "i" } },
        ],
      })
        .limit(20)
        .select("product_name imageName selectedFields")
        .lean();

      if (fallback.length > 0) {
        console.log(`🔁 Fallback found ${fallback.length} products`);
        return res.json(
          fallback.map(p => ({
            id: p._id,
            product_name: p.product_name,
            imageUrl: `/images/uploded_image/${p.imageName}`,
            imageName: p.imageName,
            details: p.selectedFields || {},
          }))
        );
      }
    }

    /* ============================================================
       STEP 7️⃣ — FINAL RESPONSE
       ============================================================ */
    res.json(formatted);
  } catch (err) {
    console.error("❌ Keyword search error:", err);
    res.status(500).json({ error: "Server error during keyword search" });
  }
});

module.exports = router;
 