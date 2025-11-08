// const Product = require('../models/Product'); 
const ProductModelSchema = require('../models/ProductModelSchema');

// Helper: update the dynamic model schema
async function updateDynamicModelSchema(productData) {
  const schema = await ProductModelSchema.findOne() || new ProductModelSchema();

  // Update categories
  if (!schema.categories.includes(productData.category)) {
    schema.categories.push(productData.category);
  }

  // Update fields
  const fieldsToCheck = {
    subCategory: productData.subCategory,
    materials: productData.materials,
    colors: productData.colors, 
    size: productData.size,
    useCase: productData.useCase
  };

  for (const [fieldName, value] of Object.entries(fieldsToCheck)) {
    let field = schema.fields.find(f => f.name === fieldName);
    if (!field) {
      field = { name: fieldName, values: [] };
      schema.fields.push(field);
    }

    const valuesToAdd = Array.isArray(value) ? value : [value];
    valuesToAdd.forEach(v => {
      if (v && !field.values.includes(v)) {
        field.values.push(v);
      }
    }); 
  }

  schema.lastUpdated = new Date();
  await schema.save();
}

// POST /products/create
exports.createProduct = async (req, res) => {
  try {
    const productData = req.body;

    const newProduct = new Product(productData);
    await newProduct.save();

    await updateDynamicModelSchema(productData);

    res.status(201).json({ message: 'Product created', product: newProduct });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// GET /products/model
exports.getModelSchema = async (req, res) => {
  try {
    const schema = await ProductModelSchema.findOne();
    res.status(200).json({ modelSchema: schema });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch model schema' });
  }
};
