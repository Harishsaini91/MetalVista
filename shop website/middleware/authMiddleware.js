// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  if (req.session && req.session.userId) {
    req.user = {
      _id: req.session.userId,
      role: req.session.userRole,
      gmail: req.session.gmail
    };
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).send("Access denied");
  }
};

const roleCheck = (role) => {
  return (req, res, next) => {
    if (req.session.userRole === role) next();
    else res.status(403).json({ message: "Access Denied" });
  };
};

module.exports = { authenticate, isAdmin, roleCheck };
