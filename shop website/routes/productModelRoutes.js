const express = require('express');
const router = express.Router();
const productModelController = require('../controller/productModelController');
const { authenticate, isAdmin } = require('../condition/condition');

// GET /product-model/schema - View current schema
router.get('/schema', authenticate, productModelController.getSchema);

// POST /product-model/save - Save or update full schema
router.post('/save', authenticate, isAdmin, productModelController.saveSchema);

// POST /product-model/category/add - Add new category
router.post('/category/add', authenticate, isAdmin, productModelController.addCategory);

// POST /product-model/field/add - Add new field
router.post('/field/add', authenticate, isAdmin, productModelController.addField);

// DELETE /product-model/field/delete - Delete a field by name
router.delete('/field/delete', authenticate, isAdmin, productModelController.deleteField);

// DELETE /product-model/category/delete - Delete a category
router.delete('/category/delete', authenticate, isAdmin, productModelController.deleteCategory);

module.exports = router;
   