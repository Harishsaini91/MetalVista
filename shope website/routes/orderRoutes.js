const express = require('express');
const router = express.Router();
const orderController = require('../controller/orderController');
const { authenticate } = require('../condition/condition');

// POST /orders/start - Start OTP verification and create order
router.post('/start', authenticate, orderController.startVerification);

// POST /orders/verify - Verify OTP
router.post('/verify', authenticate, orderController.verifyOTP);

// POST /orders/details - Get order details after verification
router.post('/details', authenticate, orderController.getOrderDetails);

module.exports = router;
