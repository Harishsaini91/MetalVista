// routes/cloud_productRoutes.js
const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware"); // Cloudinary-powered multer
const { roleCheck, authenticate } = require("../middleware/authMiddleware");
const routerController = require("../controller/router_controller");
const File = require("../models/fileSchema");

// ✅ 1. Upload Top Slide Images (Home)
router.post(
  "/home",
  authenticate,
  roleCheck("admin"),
  upload.array("images", 20),
  routerController.top_slide_image
);

// ✅ 2. Upload Product Extra Images
router.post(
  "/product_details",
  authenticate,
  roleCheck("admin"),
  upload.array("images", 20),
  routerController.product_extra_image
);

// ✅ 3. Upload Product Main Images
router.post(
  "/product",
  authenticate,
  roleCheck("admin"),
  upload.array("images", 20),
  routerController.product
);

// ✅ 4. Optional — Generic single file upload (if needed elsewhere)
router.post("/upload", authenticate, upload.single("file"), async (req, res) => {
  try {
    const newFile = await File.create({
      userId: req.user._id,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileUrl: req.file.path, // Cloudinary URL
      uploadedAt: new Date(),
    });

    res.json({
      success: true,
      message: "File uploaded successfully",
      file: newFile,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ 5. Fetch all uploaded files by user (for gallery or admin)
router.get("/user/:userId/files", async (req, res) => {
  try {
    const files = await File.find({ userId: req.params.userId }).sort({
      uploadedAt: -1,
    });
    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
