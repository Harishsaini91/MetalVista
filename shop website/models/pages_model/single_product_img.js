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
 
 }
);
 
const single_product_img_model = mongoose.model('single_product_img', user_schema);

module.exports = single_product_img_model;
 