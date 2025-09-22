 
const mongoose = require("mongoose");

const ProductModelDataSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "slide2_model", // optional link if you still want reference
  },
  imageName: {
    type: String,
    required: true,
    trim: true
  },
  product_name: {  
    type: String,
    required: true,
    trim: true 
  },
  subnames: {
    type: [String],
    default: []
  },
  
  selectedFields: {
    type: Object,
    default: {} 
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("ProductModelData", ProductModelDataSchema);
