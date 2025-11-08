const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // Who placed the order
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // What product(s) were ordered
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, default: 1 },
        price: { type: Number, required: true },
      },
    ],

    // Total cost of order
    totalAmount: { type: Number, required: true },

    // Link order ↔ payment
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },

    // Custom order ID (e.g. "ORD_12345")
    orderId: { type: String, unique: true },

    // OTP verification (if you’re doing SMS/email confirmation)
    otp: String,
    method: { type: String, enum: ["email", "sms"], default: "email" },
    verified: { type: Boolean, default: false },
    expiresAt: Date,

    // Status of the order itself
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true } // adds createdAt + updatedAt automatically
);

module.exports = mongoose.model("Order", orderSchema);
 