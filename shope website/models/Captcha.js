// models/Captcha.js
const mongoose = require('mongoose');

const CaptchaSchema = new mongoose.Schema({
  hash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, index: { expires: '5m' } }, // auto-expire
  ip: { type: String } // optional
});

module.exports = mongoose.model('Captcha', CaptchaSchema);
