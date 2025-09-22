 
const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  name: { type: String, required: true },        // e.g., "Length"
  values: [String],                              // e.g., ["300mm", "400mm"]
  type: { type: String, default: "text" },       // e.g., "number", "text", "dropdown"
  unit: { type: String },                        // e.g., "mm", "kg", optional
  description: { type: String },                 // Optional tooltip/help text
  categories: [String]                           // Categories this field applies to
}, { _id: false });

const productModelSchema = new mongoose.Schema({
  categories: [String],                          // Master list of all categories
  fields: [fieldSchema],                         // Dynamic fields
  createdBy: { type: String },                   // Optional: admin email/ID
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ProductModelSchema', productModelSchema);
 