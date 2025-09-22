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




/** 
 * ✅ GET: Full Product Entry Form (popup)
 */
// router.get('/full-entry', async (req, res) => {
//   try {
//     const imageName = req.query.imageName || null;

//     // Load base model
//     const model = await ProductModelSchema.findOne();

//     let product = null;
//     let savedData = null;

//     if (imageName) {
//       // ✅ find product by its `name` (image filename)
//       product = await product_model_data.findOne({ name: imageName });

//       // ✅ also fetch savedData related to that image
//       savedData = await ProductModelData.findOne({ imageName });
//     }

//     res.render('product_full_entry', {
//       model,
//       imageName,
//       savedData,
//       product_name: product ? product.product_name : null,
//       subnames: product ? product.subnames : [],
//       product
//     });
//   } catch (err) {
//     console.error("Error in /full-entry:", err);
//     res.status(500).send("Internal Server Error");
//   }
// });

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
 

// 

// router.get('/api/search-products', async (req, res) => {
//   const query = req.query.q?.toLowerCase();
//   if (!query) return res.json([]);

//   try {
//     const matches = await ProductModelData.find({
//       $or: [
//         { imageName: { $regex: query, $options: 'i' } },
//         { 'selectedFields': { $regex: query, $options: 'i' } }
//       ]
//     }).limit(10);

//     const formatted = matches.map(p => ({
//       id: p._id,
//       name: p.imageName,
//       imageUrl: `/images/uploded_image/${p.imageName}`,
//       imageName: p.imageName
//     }));

//     res.json(formatted);
//   } catch (err) {
//     console.error("Search error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });


// router.get('/api/search-products', async (req, res) => {
//   const query = req.query.q?.toLowerCase();
//   if (!query) return res.json([]);

//   try {
//     const matches = await ProductModelData.find();

//     const filtered = matches.filter(product => {
//       const matchInName = product.imageName?.toLowerCase().includes(query);
//       const matchInFields = Object.values(product.selectedFields || {}).some(values =>
//         values.some(val => val.toLowerCase().includes(query))
//       );
//       return matchInName || matchInFields;
//     });

//     const formatted = filtered.map(p => ({
//       id: p._id,
//       name: p.imageName,
//       imageUrl: `/images/uploded_image/${p.imageName}`, 
//       imageName: p.product_name
//     }));

//     res.json(formatted);
//   } catch (err) {
//     console.error("Search error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });


router.get('/api/search-products', async (req, res) => {
  const query = req.query.q?.toLowerCase();
  if (!query) return res.json([]);

  try {
    // Search by product_name, imageName, subnames, and selectedFields
    const matches = await ProductModelData.find({
      $or: [
        { product_name: { $regex: query, $options: "i" } },
        { imageName: { $regex: query, $options: "i" } },
        { subnames: { $elemMatch: { $regex: query, $options: "i" } } },
        // Search inside selectedFields values (converted to string)
        { "selectedFields.category": { $regex: query, $options: "i" } },
        { "selectedFields.brand": { $regex: query, $options: "i" } },
        { "selectedFields.type": { $regex: query, $options: "i" } }
      ]
    });

    const formatted = matches.map(p => ({
      id: p._id,
      product_name: p.product_name, // ✅ human-readable name
      imageUrl: `/images/uploded_image/${p.imageName}`, 
      imageName: p.imageName  // ✅ actual image filename (used for routing)
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Server error" });
  }
});



// router.post('/update-product', async (req, res) => {
//   try {
//     const { imageName, product_name, subnames } = req.body;

//     // convert comma separated string -> array
//     const subnamesArray = subnames ? subnames.split(",").map(s => s.trim()) : [];

//     await slide2_model.findOneAndUpdate(
//       { name: imageName },   // match uploaded image filename
//       { product_name, subnames: subnamesArray },
//       { new: true }
//     );

//     res.redirect(`/full-entry?imageName=${imageName}`);
//   } catch (err) {
//     console.error("Error updating product:", err);
//     res.status(500).send("Internal Server Error");
//   }
// });

 
// router.post('/update-product', async (req, res) => {
//   try {
//     const { imageName, product_name, subnames } = req.body;

//     // convert comma separated string -> array
//     const subnamesArray = subnames ? subnames.split(",").map(s => s.trim()) : [];

//     await slide2_model.findOneAndUpdate(
//       { name: imageName },   // match uploaded image filename
//       { product_name, subnames: subnamesArray },
//       { new: true }
//     );

//     // res.redirect(`/products/full-entry?imageName=${imageName}`);
//   } catch (err) {
//     console.error("Error updating product:", err);
//     res.status(500).send("Internal Server Error");
//   }  
// });


// router.post('/update-product', async (req, res) => {
//   try {
//     const { category, imageName, product_name, subnames } = req.body;

//     // Convert comma-separated string → array
//     const subnamesArray = subnames ? subnames.split(",").map(s => s.trim()) : [];

//     // 1️⃣ First check in slide2_model
//     const updatedSlide2 = await slide2_model.findOneAndUpdate(
//       { name: imageName },   // match uploaded image filename
//       { product_name, subnames: subnamesArray },
//       { new: true }
//     );

//     if (updatedSlide2) {
//       console.log("✅ Updated inside slide2_model");
//       return res.redirect(`/products/full-entry?imageName=${imageName}`);
//     }

//     // 2️⃣ If not found in slide2_model → check in product_model (new schema)
//     const updatedProduct = await product_model.findOneAndUpdate(
//       { [`${category}.imageName`]: imageName },  
//       { 
//         $set: { 
//           [`${category}.$.product_name`]: product_name,
//           [`${category}.$.subnames`]: subnamesArray
//         }
//       },
//       { new: true }
//     );

//     if (updatedProduct) {
//       console.log("✅ Updated inside product_model (existing entry)");
//       return res.redirect(`/products/full-entry?imageName=${imageName}`);
//     }

//     // 3️⃣ If not found in either → push new into product_model
//     await product_model.updateOne(
//       {}, // update first document (you might later want category-specific docs)
//       { $push: { [category]: { imageName, product_name, subnames: subnamesArray } } }
//     );

//     console.log("🆕 Added new product inside product_model");
//     res.redirect(`/products/full-entry?imageName=${imageName}`);

//   } catch (err) {
//     console.error("❌ Error updating product:", err);
//     res.status(500).send("Internal Server Error");
//   }
// });



// router.post('/update-product', async (req, res) => {
//   try {
//     const { imageName, product_name, subnames } = req.body;

//     // Convert comma-separated string → array
//     const subnamesArray = subnames ? subnames.split(",").map(s => s.trim()) : [];

//     // 1️⃣ Try update if product already exists
//     const updatedProduct = await ProductModelData.findOneAndUpdate(
//       { imageName },   // match by uploaded image filename
//       { product_name, subnames: subnamesArray },
//       { new: true }
//     );

//     if (updatedProduct) {
//       console.log("✅ Updated existing product in ProductModelData");
//       return res.redirect(`/products/full-entry?imageName=${imageName}`);
//     }

// // 2️⃣ If not found → create new entry
// const slide2Doc = await slide2_model.findOne({ name: imageName });
// if (!slide2Doc) {
//   return res.status(400).send("No matching slide2_model found for this image");
// }

// const newProduct = new ProductModelData({
//   productId: slide2Doc._id,   // ✅ ensure productId exists
//   imageName,
//   product_name,
//   subnames: subnamesArray
// });

// await newProduct.save();


//     console.log("🆕 Added new product in ProductModelData");
//     res.redirect(`/products/full-entry?imageName=${imageName}`);

//   } catch (err) {
//     console.error("❌ Error updating product:", err);
//     res.status(500).send("Internal Server Error");
//   }
// });


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




module.exports = router;
  