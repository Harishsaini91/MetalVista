const mongoose = require("mongoose");


const user_schema = mongoose.Schema({
    
    name: {
        type: String,
        required: [true, 'slide2 err'],
        // unique: true,
    }, 
 
 }
);

const slide2_model = mongoose.model('slide2', user_schema);

module.exports = slide2_model;
 