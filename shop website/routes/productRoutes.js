const express = require('express');
const router = express.Router();
const ProductModelSchema = require('../models/ProductModelSchema');
const ProductModelData = require('../models/product_model_data');
const slide2_model = require("../models/pages_model/slide2");
const product_model = require("../models/pages_model/product_range");
const product_model_data = require('../models/product_model_data');


// Load model editor page
router.get('/model-editor', async (req, res) => {
  const model = await ProductModelSchema.findOne();
  res.render('handel_product_details/admin_product_model', { model });
});

// Save selected field values
router.post('/model-editor/save', async (req, res) => {
  const formData = req.body;
  let schema = await ProductModelSchema.findOne();
  if (!schema) schema = new ProductModelSchema();

  for (const [fieldName, value] of Object.entries(formData)) {
    if (!fieldName || fieldName === 'fieldName' || fieldName === 'value') continue;

    let field = schema.fields.find(f => f.name === fieldName);
    if (!field) {
      field = { name: fieldName, values: [] };
      schema.fields.push(field);
    } 

    const valuesArray = Array.isArray(value) ? value : [value];
    valuesArray.forEach(val => {
      if (val && !field.values.includes(val)) {
        field.values.push(val);
      }
    });
  }

  schema.lastUpdated = new Date();
  await schema.save();

  res.redirect('/products/model-editor');
});

// Add a new field
router.post('/model-editor/add-field', async (req, res) => {
  const { name, type, unit, description } = req.body;
  let schema = await ProductModelSchema.findOne();
  if (!schema) schema = new ProductModelSchema();

  const exists = schema.fields.some(f => f.name === name);
  if (!exists) {
    schema.fields.push({
      name,
      type: type || 'text',
      unit,
      description,
      values: []
    });
    schema.lastUpdated = new Date();
    await schema.save();
  }

  res.redirect('/products/model-editor');
});

// Delete a field
router.post('/model/delete-field', async (req, res) => {
  const { fieldName } = req.body;
  if (!fieldName) return res.redirect('/products/model-editor');

  let schema = await ProductModelSchema.findOne();
  if (schema) {
    schema.fields = schema.fields.filter(field => field.name !== fieldName);
    schema.lastUpdated = new Date();
    await schema.save();
  }

  res.redirect('/products/model-editor');
});

// Delete a single value from a field
router.post('/model/delete-value', async (req, res) => {
  const { fieldName, value } = req.body;
  if (!fieldName || !value) return res.redirect('/products/model-editor');

  let schema = await ProductModelSchema.findOne();
  if (schema) {
    const field = schema.fields.find(f => f.name === fieldName);
    if (field) {
      field.values = field.values.filter(v => v !== value);
      schema.lastUpdated = new Date();
      await schema.save();
    }
  }
 
  res.redirect('/products/model-editor');
});




 

router.get('/full-entry', async (req, res) => {
  try {
    const imageName = req.query.imageName || null;

    // Load base model (for UI)
    const model = await ProductModelSchema.findOne();

    let savedData = null;

    if (imageName) {
      // Directly fetch product details from ProductModelData
      savedData = await ProductModelData.findOne({ imageName });
    }

    res.render("handel_product_details/product_full_entry", {
      model,
      imageName,
      savedData,
      product_name: savedData ? savedData.product_name : null,
      subnames: savedData ? savedData.subnames : []
    });

  } catch (err) {
    console.error("❌ Error in /full-entry:", err);
    res.status(500).send("Internal Server Error");
  }  
});



/**
 * ✅ POST: Save Selected Fields for Product (after image uploaded)
 */
router.post('/save-model-data', async (req, res) => {
  const { imageName, ...fields } = req.body;

  if (!imageName) {
    return res.status(400).send("Missing image name.");
  }  

  const selectedFields = {};
  for (const [key, value] of Object.entries(fields)) {
    selectedFields[key] = Array.isArray(value) ? value : [value];
  }  
  // Upsert: update if already exists, else create
  await ProductModelData.findOneAndUpdate(
    { imageName },
    { imageName, selectedFields },
    { upsert: true, new: true }
  );

  res.send("✅ Field data saved!");
}); 
 
   
 

// 📌 Update or create product entry
router.post("/update-product", async (req, res) => { 
  try {
    const { imageName, product_name, subnames } = req.body;

    // ✅ Guard clause for required fields
    if (!imageName || !product_name) {
      return res.status(400).send("❌ imageName and product_name are required");
    }    
   
    // ✅ Convert comma-separated → unique trimmed array
    const subnamesArray = subnames
      ? [...new Set(subnames.split(",").map(s => s.trim()).filter(Boolean))]
      : [];
  
    // 1️⃣ Try to update if already exists
    let product = await ProductModelData.findOneAndUpdate(
      { imageName },
      { product_name, subnames: subnamesArray },
      { new: true, runValidators: true }
    ); 

    if (product) {
      console.log("✅ Updated existing product:", product._id);
      return res.redirect(`/products/full-entry?imageName=${imageName}`);
    }

    // 2️⃣ If not found → create new product
    product = new ProductModelData({
      imageName,
      product_name,
      subnames: subnamesArray
    });

    await product.save();
    console.log("🆕 Added new product:", product._id);

    return res.redirect(`/products/full-entry?imageName=${imageName}`);

  } catch (err) {
    console.error("❌ Error in /update-product:", err);
    return res.status(500).send("Internal Server Error");
  }
});




// 🔍 Search products by name, image, subnames, or selected fields
router.get('/api/search-products', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);

  // Split query into individual keywords, ignore empty strings
  const keywords = query
    .toLowerCase()
    .split(' ')
    .filter(k => k.trim() !== '');

  try {
    // Build $or conditions for each keyword
    const orConditions = keywords.flatMap(keyword => ([
      { product_name: { $regex: keyword, $options: "i" } },
      { imageName: { $regex: keyword, $options: "i" } },
      { subnames: { $elemMatch: { $regex: keyword, $options: "i" } } },
      { "selectedFields.category": { $regex: keyword, $options: "i" } },
      { "selectedFields.brand": { $regex: keyword, $options: "i" } },
      { "selectedFields.type": { $regex: keyword, $options: "i" } },
      { "selectedFields.material": { $regex: keyword, $options: "i" } },
      { "selectedFields.color": { $regex: keyword, $options: "i" } },
      { "selectedFields.weight": { $regex: keyword, $options: "i" } },
      { "selectedFields.surface": { $regex: keyword, $options: "i" } }, 
      { "selectedFields.foldable": { $regex: keyword, $options: "i" } },
      { "selectedFields.usage": { $regex: keyword, $options: "i" } },
      { "selectedFields.isNew": { $regex: keyword, $options: "i" } },
      { "selectedFields.servicesIncluded": { $regex: keyword, $options: "i" } },
      { "selectedFields.style": { $regex: keyword, $options: "i" } }
    ]));

    // Query products matching any keyword in any field
    const matches = await ProductModelData.find({ $or: orConditions });

    // Format response
    const formatted = matches.map(p => ({
      id: p._id,
      product_name: p.product_name,
      imageUrl: `/images/uploded_image/${p.imageName}`,
      imageName: p.imageName
    }));  

    res.json(formatted);

  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
 

module.exports = router;
   