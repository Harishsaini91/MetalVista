// routes/captchaRoutes.js
const express = require('express');
const router = express.Router();
const captcha = require('../controller/captchaController');

router.get('/new', captcha.newCaptcha || captcha.newCaptcha); // returns code for dev (or change to /new-image for image)
router.post('/verify', captcha.verifyCaptcha);

module.exports = router;
