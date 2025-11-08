const express = require('express');
const bodyParser = require('body-parser');
const routerController = require('../controller/router_controller');
const chatController  = require('../controller/chatController');
const condition = require('../condition/condition');
 

const userRoutes = express();
userRoutes.use(express.json());
userRoutes.use(bodyParser.json());
userRoutes.use(bodyParser.urlencoded({ extended: true }));
userRoutes.set('view engine', 'ejs');
userRoutes.use(express.static('public'));
const session = require('express-session');

 
 
// 
userRoutes.use(session({
    secret: process.env.SESSION_SECRET || 'your-strong-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Change to true for HTTPS
}));

// 
 
userRoutes.get('/home', routerController.home_page);
// userRoutes.post('/home', condition.roleCheck('admin'), condition.upload.single("image"), routerController.top_slide_image);
userRoutes.post(
    '/home',
    condition.roleCheck('admin'), 
    condition.upload.array("images", 20),    
    routerController.top_slide_image  
);
 

userRoutes.get('/product_details', routerController.product_details_page);
// userRoutes.post('/product_details', condition.upload.single("image"), routerController.product_extra_image);
userRoutes.post('/product_details',condition.roleCheck('admin'),  condition.upload.array("images",20),  routerController.product_extra_image );

userRoutes.get('/product', routerController.product_page);

userRoutes.post('/product',condition.roleCheck('admin'), condition.upload.array("images", 20), routerController.product);

userRoutes.get('/about', routerController.about_page);

userRoutes.get('/sign_in', routerController.sign_in_page);
userRoutes.post('/sign_in', routerController.sign_in_page_post);
userRoutes.post('/delete_image', routerController.delete_image); 
userRoutes.post('/product_delete_image', routerController.product_delete_image);
userRoutes.post('/extra_product_delete_image', routerController.extra_product_delete_image);

userRoutes.get('/logout', routerController.logout);
userRoutes.get('/upload_err', routerController.upload_err);

// userRoutes.post('/page2', routerController.page2_post);

// Chat routes
userRoutes.get('/user/chat', condition.authenticate, chatController.getUserRoom);

userRoutes.get('/admin/chat', condition.roleCheck('admin'), chatController.getAdminRooms);
userRoutes.get('/admin/chat/:roomId', condition.authenticate,condition.roleCheck('admin'), chatController.joinRoom);

module.exports = userRoutes;
     