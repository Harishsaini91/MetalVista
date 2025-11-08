// ✅ routes/products.js
const express = require("express");
const router = express.Router();
const ProductModelSchema = require("../models/ProductModelSchema"); // <-- your schema file

// --- Get product schema ---
router.get("/api/get-schema", async (req, res) => {
  try {
    console.log("📡 Fetching product schema...");
    const schema = await ProductModelSchema.findOne().lean();

    if (!schema) {
      console.warn("⚠️ No schema found in DB!");
      return res.status(404).json({ message: "No schema found" });
    }
console.log(schema);

    res.json(schema);
  } catch (err) {
    console.error("❌ Error fetching schema:", err);
    res.status(500).json({ message: "Server error while fetching schema" });
  }
});

module.exports = router;
  