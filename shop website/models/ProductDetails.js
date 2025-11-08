// models/ProductDetails.js
const mongoose = require("mongoose");

const productDetailsSchema = new mongoose.Schema({
  imageName: { type: String, required: true, unique: true },  // product primary key
  selectedFields: { type: Map, of: [String] },                // { "Length": ["300mm"], "Color": ["Red"] }
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ProductDetails", productDetailsSchema);
