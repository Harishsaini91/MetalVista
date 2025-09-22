// models/payment.js
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    amount: { type: Number, required: true },

    // Supports all methods so you're future-proof
    paymentMethod: {
      type: String,
      enum: ["Razorpay", "UPI", "BankTransfer", "Card"],
      required: true,
      default: "Razorpay",
    },

    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      default: "Pending",
    },

    // Razorpay-specific
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },

    // UPI/manual fields (kept for compatibility)
    upiIdUsed: String,
    qrCode: String,

    details: {
      userName: String,
      userEmail: String,
      adminName: String,
      adminEmail: String,
      accountOwner: String,
      orderName: String,
      paymentType: String,

      bankDetails: {
        accountNumber: String,
        ifscCode: String,
        accountName: String,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
