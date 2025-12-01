// middleware/uploadMiddleware.js
const multer = require("multer");
const path = require("path");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// ✅ Filter allowed file types
const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png|gif|mp4|mkv|avi|mov|glb|fbx|obj/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = fileTypes.test(file.mimetype);

  if (extname && mimeType) cb(null, true);
  else cb(new Error("Only image, video, or 3D files allowed!"));
};

// ✅ Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: `user_uploads/${req.user?._id || "guest"}`,
    resource_type: "auto", // supports image/video/raw
    public_id: `${Date.now()}_${file.originalname.split(".")[0]}`,
  }),
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024, files: 20 },
  fileFilter,
});

module.exports = upload;
