const ProductModelSchema = require('../models/ProductModelSchema');

// 1. Get current schema
exports.getSchema = async (req, res) => {
  try {
    const schema = await ProductModelSchema.findOne();
    res.status(200).json(schema || {});
  } catch (err) {
    res.status(500).json({ message: 'Error fetching schema', error: err.message });
  }
};

// 2. Save or update full schema
exports.saveSchema = async (req, res) => {
  try {
    const { categories, fields, createdBy } = req.body;

    let schema = await ProductModelSchema.findOne();
    if (!schema) {
      schema = new ProductModelSchema({ categories, fields, createdBy });
    } else {
      schema.categories = categories;
      schema.fields = fields;
      schema.createdBy = createdBy;
      schema.lastUpdated = new Date();
    }

    await schema.save();
    res.status(200).json({ message: 'Schema saved', schema });
  } catch (err) {
    res.status(500).json({ message: 'Error saving schema', error: err.message });
  }
};

// 3. Add a new category
exports.addCategory = async (req, res) => {
  try {
    const { category } = req.body;
    const schema = await ProductModelSchema.findOne();

    if (!schema.categories.includes(category)) {
      schema.categories.push(category);
      schema.lastUpdated = new Date();
      await schema.save();
    }

    res.status(200).json({ message: 'Category added', categories: schema.categories });
  } catch (err) {
    res.status(500).json({ message: 'Error adding category', error: err.message });
  }
};

// 4. Add a new field
exports.addField = async (req, res) => {
  try {
    const { field } = req.body; // field should match the schema shape

    const schema = await ProductModelSchema.findOne();
    schema.fields.push(field);
    schema.lastUpdated = new Date();
    await schema.save();

    res.status(200).json({ message: 'Field added', fields: schema.fields });
  } catch (err) {
    res.status(500).json({ message: 'Error adding field', error: err.message });
  }
};

// 5. Delete a field by name
exports.deleteField = async (req, res) => {
  try {
    const { fieldName } = req.body;

    const schema = await ProductModelSchema.findOne();
    schema.fields = schema.fields.filter(field => field.name !== fieldName);
    schema.lastUpdated = new Date();
    await schema.save();

    res.status(200).json({ message: 'Field deleted', fields: schema.fields });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting field', error: err.message });
  }
};

// 6. Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const { category } = req.body;

    const schema = await ProductModelSchema.findOne();
    schema.categories = schema.categories.filter(cat => cat !== category);
    schema.lastUpdated = new Date();
    await schema.save();

    res.status(200).json({ message: 'Category deleted', categories: schema.categories });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting category', error: err.message });
  }
};
