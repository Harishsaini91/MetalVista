const express = require('express');
const app = express();
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const http = require('http');
const socketio = require('socket.io');
const MongoStore = require('connect-mongo');
require("dotenv").config();
console.log("ENV TEST:", process.env.RAZORPAY_KEY_ID);


// dotenv.config();

// Database connection
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shop", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("Database connected"))
  .catch(err => console.log(err));

// Session configuration (with MongoStore) 
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'your-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shop",
    collectionName: 'sessions'
  }),
  cookie: { maxAge: 86400000 } // 1 day  
});  
 
app.use(sessionMiddleware);
 
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.set("view engine", 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));

const server = http.createServer(app);
const io = socketio(server);
app.set('io', io);


// Pass sessionMiddleware to socket config (so sockets can access session)
require('./config/socket')(io, sessionMiddleware);

// Make io accessible in routes if needed 
app.use((req, res, next) => {
  req.io = io;   
  next(); 
});      
 
// Routes
const userRoutes = require('./routes/user_routes');
const chatRoutes = require('./routes/chatRoutes');
 
const productRoutes = require('./routes/productRoutes');
const openrouterChatRoutes = require('./routes/openrouterChatRoutes');
const aiRoutes = require('./routes/aiRoutes'); // new: enhanced query -> search -> results
const captchaRoutes = require('./routes/captchaRoutes'); // new


const paymentRoutes = require('./routes/paymentRoutes'); 
const orderRoutes = require('./routes/orderRoutes');
const productModelRoutes = require('./routes/productModelRoutes');


app.use('/product-model', productModelRoutes);
 

app.use('/ai', aiRoutes);
app.use('/captcha', captchaRoutes);

app.use('/orders', orderRoutes);
app.use('/payments', paymentRoutes); 
app.use('/', openrouterChatRoutes);
app.use('/', userRoutes);  
app.use('/', chatRoutes); 
app.use('/products', productRoutes);    
  

//  
// health
app.get('/health', (req, res) => res.send('OK'));

//  
const { authenticate, isAdmin } = require('./condition/condition');

app.get('/admin/product-model', authenticate, isAdmin, (req, res) => {
  res.render('admin_product_model');
});



app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!'); 
});






const PORT = 8000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
