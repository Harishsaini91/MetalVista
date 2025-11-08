const mongoose = require("mongoose");


const user_schema = mongoose.Schema({
    password: {
        type: String,
        required: [true, 'user password err'],
    },
    gmail: {
        type: String,
        required: [true, 'user gmail err'],
        // unique: true,
    },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    // 
    // is_admin: {
    //     type: String,
    //     required: [true, 'user is_admin err'],
    // },

    token: {
        type: String,
        default: ""
    },
 }
);

const user_model = mongoose.model('user_info', user_schema);

module.exports = user_model;

