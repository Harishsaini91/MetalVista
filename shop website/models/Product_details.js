// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: Number,
  category: String,                                // e.g., "Catering", "Furniture"
  attributes: [
    {
      field: { type: mongoose.Schema.Types.ObjectId, ref: "Field" }, // link to Field
      value: String                                                 // chosen value
    }
  ],
  description: String,
  createdBy: { type: String },                     // admin ID
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Product", productSchema);
