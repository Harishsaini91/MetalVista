const mongoose = require("mongoose");

const user_schema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'top_slide_image error'], // Custom error message
    }
});

const top_slide_image_model = mongoose.model('top_slide_image', user_schema);

module.exports = top_slide_image_model;
