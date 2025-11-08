const Order = require('../models/payment/Order');
// const Product = require('../models/Product');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// 1. Start verification: Send OTP
exports.startVerification = async (req, res) => {
  const { userId, method, productId } = req.body;
  const otp = generateOTP();
  const orderId = crypto.randomBytes(3).toString('hex').toUpperCase();
  const expiresAt = new Date(Date.now() + 5 * 60000); // 5 min expiry

  const order = new Order({ userId, method, productId, otp, orderId, expiresAt });
  await order.save();

  if (method === 'email') {
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: userId,
      subject: 'Your Product Access OTP',
      text: `Your OTP is: ${otp}. It will expire in 5 minutes.`
    });
  }

  res.status(200).json({ message: 'OTP sent', orderId });
};

// 2. Verify OTP
exports.verifyOTP = async (req, res) => {
  const { userId, otp } = req.body;

  const order = await Order.findOne({ userId, otp, verified: false });

  if (!order || new Date() > order.expiresAt) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  order.verified = true;
  await order.save();

  res.status(200).json({ message: 'OTP verified', orderId: order.orderId });
};

// 3. Get order details
exports.getOrderDetails = async (req, res) => {
  const { userId, orderId } = req.body;

  const order = await Order.findOne({ userId, orderId, verified: true }).populate('productId');

  if (!order) {
    return res.status(403).json({ error: 'Unauthorized or invalid order access' });
  }

  res.status(200).json({ product: order.productId });
};
