// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const paymentController = require("../controller/paymentController");
const { authenticate } = require("../condition/condition"); // you already use this elsewhere

// Require login for all payment routes
router.use(authenticate);

// Create order (from a form)
router.post("/create", paymentController.createOrder);

// Razorpay verify redirect
router.get("/verify", paymentController.verifyPayment);

// Webhook (optional) - must be RAW body parser in app.js if you enable it
router.post("/webhook", express.json({ type: "*/*" }), paymentController.webhook);

// Success / Failed pages
router.get("/success/:id", paymentController.paymentSuccess);
router.get("/failed/:id", paymentController.paymentFailed);

// History
router.get("/history", paymentController.paymentHistory);

// Status API (optional)
router.get("/status/:id", paymentController.getStatus);

// Download PDF
router.get("/download/:id", paymentController.downloadPdf);

// Dev simulate (ONLY for local testing)
router.get("/dev/simulate", paymentController.devSimulate);

module.exports = router;
