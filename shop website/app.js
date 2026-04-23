// app.js
require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const http = require('http');
const socketio = require('socket.io');

// Debug env test
console.log("ENV TEST:", process.env.RAZORPAY_KEY_ID);

// --------------------------------------------------
// Database Connection
// --------------------------------------------------

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("🔥 MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));


// --------------------------------------------------
// Session Configuration
// --------------------------------------------------
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'your-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 60 * 60 * 24 // 1 day
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    sameSite: "lax"
  }
});

app.use(sessionMiddleware);

// --------------------------------------------------
// Middleware
// --------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// --------------------------------------------------
// Server & Socket.io
// --------------------------------------------------
const server = http.createServer(app);
const io = socketio(server);

// Make express-session available inside socket.io
require('./config/socket')(io, sessionMiddleware);

// Attach io to req for all routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --------------------------------------------------
// Routes
// --------------------------------------------------
const userRoutes = require('./routes/user_routes');
const chatRoutes = require('./routes/chatRoutes');
const productRoutes = require('./routes/productRoutes');
const openrouterChatRoutes = require('./routes/openrouterChatRoutes');
const aiRoutes = require('./routes/aiRoutes');
const captchaRoutes = require('./routes/captchaRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productModelRoutes = require('./routes/productModelRoutes');
const schema_ai = require("./routes/products");

// Cloudinary Updated Product Routes (NEW MEDIA SCHEMA)
const cloudProductRoutes = require('./routes/cloud_productRoutes');

// Priority applied
app.use('/', cloudProductRoutes);

app.use("/products", schema_ai);
app.use('/product-model', productModelRoutes);
app.use('/ai', aiRoutes);
app.use('/captcha', captchaRoutes);
app.use('/orders', orderRoutes);
app.use('/payments', paymentRoutes);
app.use('/', openrouterChatRoutes);
app.use('/', chatRoutes);
app.use('/', userRoutes);
app.use('/products', productRoutes);

// --------------------------------------------------
// Health Check
// --------------------------------------------------
app.get('/health', (req, res) => res.send('OK'));

// --------------------------------------------------
// Admin Routes
// --------------------------------------------------
const { authenticate, isAdmin } = require('./condition/condition');

app.get('/admin/product-model', authenticate, isAdmin, (req, res) => {
  res.render('admin_product_model');
});

// --------------------------------------------------
// Global Error Handler
// --------------------------------------------------
app.use((err, req, res, next) => {
  console.error("🔥 Unhandled error:", err.stack);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal Server Error' });
  } else {
    next(err);
  }
});

// --------------------------------------------------
// Start Server
// --------------------------------------------------
const PORT = 8000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
