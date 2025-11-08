const mongoose = require("mongoose");

const user_schema = mongoose.Schema({
  extra_image_name: {
    type: [String],  // Change this to an array of strings
    required: [true, 'extra_image_name err'], 
  },
  product_name: {
    type: String,
    required: [true, 'product_name err'],
  },
});

const product_extra_images_model = mongoose.model('product_extra_images', user_schema);

module.exports = product_extra_images_model;
