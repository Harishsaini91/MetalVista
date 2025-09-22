// controllers/paymentController.js
const Razorpay = require("razorpay");
const crypto = require("crypto");
const PDFDocument = require("pdfkit");
const Payment = require("../models/payment/payment");


const razorpay = new Razorpay({

  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order and render checkout page
exports.createOrder = async (req, res) => {
  try {
    const { amount, orderName, paymentType } = req.body;
    if (!amount) return res.status(400).send("Amount is required");



   // 🔎 Debug log
    console.log("Using Razorpay Keys:", {
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET ? "*****HIDDEN*****" : undefined
    });

    const options = {
      amount: Number(amount) * 100, // paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      payment_capture: 1,
    }; 

    const order = await razorpay.orders.create(options); 

    const payment = new Payment({
      user: req.user._id, // make sure authenticate middleware sets req.user
      amount: Number(amount),
      paymentMethod: "Razorpay",
      status: "Pending",
      razorpayOrderId: order.id,
      details: {
        userName: req.user.name,
        userEmail: req.user.email,
        orderName,
        paymentType,
      },
    });

    await payment.save();

    return res.render("payment/razorpay_payment_page", {
      keyId: process.env.RAZORPAY_KEY_ID,
      order,
      paymentId: payment._id,
    });
} catch (err) {
  console.error("Full Razorpay Error:", JSON.stringify(err, null, 2));
  res.status(err?.statusCode || 500).json({
    success: false,
    message: err?.error?.description || err.message || "Error creating Razorpay order",
  });
}
 
};

// Verify Razorpay payment after checkout handler redirects back
exports.verifyPayment = async (req, res) => {
  try {
    const { payment_id, order_id, signature, id } = req.query;
    if (!payment_id || !order_id || !signature || !id) {
      return res.status(400).send("Missing verification parameters");
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(order_id + "|" + payment_id)
      .digest("hex");

    if (expectedSignature === signature) {
      await Payment.findByIdAndUpdate(id, {
        status: "Completed",
        razorpayPaymentId: payment_id,
      });
      return res.redirect(`/payments/success/${id}`);
    } else {
      await Payment.findByIdAndUpdate(id, { status: "Failed" });
      return res.redirect(`/payments/failed/${id}`);
    }
  } catch (err) {
    console.error("verifyPayment error:", err);
    res.status(500).send("Error verifying payment");
  }
};

// (Optional) Razorpay webhook (configure in Razorpay dashboard)
exports.webhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (expected !== signature) return res.status(400).send("Invalid signature");

    const orderId = req.body?.payload?.payment?.entity?.order_id;
    if (orderId) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: orderId },
        { status: "Completed" }
      );
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("webhook error:", e);
    res.status(500).send("Webhook error");
  }
};

// Success/Failed pages
exports.paymentSuccess = async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).send("Payment not found");
  res.render("payment/payment_receipt", { payment });
};

exports.paymentFailed = async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).send("Payment not found");
  res.render("payment/payment_failed", { payment });
};

// History
exports.paymentHistory = async (req, res) => {
  const payments = await Payment.find({ user: req.user._id }).sort({
    createdAt: -1,
  });
  res.render("payment/payment_history", { payments });
};

// API: status (handy for polling or debugging)
exports.getStatus = async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).json({ error: "Not found" });
  res.json({ status: payment.status });
};

// Download PDF receipt
exports.downloadPdf = async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).send("Payment not found");

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=receipt_${payment._id}.pdf`
  );
  doc.pipe(res);

  doc.fontSize(18).text("Payment Receipt", { align: "center" });
  doc.moveDown();

  doc.fontSize(12);
  doc.text(`Receipt ID: ${payment._id}`);
  doc.text(`Date: ${payment.createdAt.toLocaleString()}`);
  doc.text(`User: ${payment.details.userName || ""}`);
  doc.text(`Email: ${payment.details.userEmail || ""}`);
  doc.text(`Amount: ₹${payment.amount}`);
  doc.text(`Status: ${payment.status}`);
  doc.text(`Method: ${payment.paymentMethod}`);
  if (payment.razorpayOrderId) doc.text(`Razorpay Order: ${payment.razorpayOrderId}`);
  if (payment.razorpayPaymentId) doc.text(`Razorpay Payment: ${payment.razorpayPaymentId}`);

  doc.end();
};

// DEV: simulate success/failure without hitting Razorpay (remove in production)
exports.devSimulate = async (req, res) => {
  const { id, result } = req.query; // result = "success" | "fail"
  const payment = await Payment.findById(id);
  if (!payment) return res.status(404).send("Payment not found");

  if (result === "success") {
    payment.status = "Completed";
    payment.razorpayPaymentId = payment.razorpayPaymentId || `pay_${Date.now()}`;
    await payment.save();
    return res.redirect(`/payments/success/${payment._id}`);
  } else {
    payment.status = "Failed";
    await payment.save();
    return res.redirect(`/payments/failed/${payment._id}`);
  }
};
