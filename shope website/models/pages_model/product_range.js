const mongoose = require("mongoose");

const user_schema = mongoose.Schema({
  indoor: {
    type: [String], // Array of strings to store multiple image names
    default: [], // Default to an empty array
  },
  outdoor: {
    type: [String],
    default: [],
  },
  counter: {
    type: [String],
    default: [],
  },
  art: {
    type: [String],
    default: [],
  }, 
  other: {
    type: [String],
    default: [],
  },
});

// Create the product model
const product_model = mongoose.model("product", user_schema);

module.exports = product_model;
 
 