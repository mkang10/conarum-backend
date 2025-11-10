const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const streamifier = require("streamifier");

// Cloudinary config từ env
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Middleware thông minh: form-data -> Cloudinary, JSON/raw -> bỏ qua
const uploadCloudinary = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";

  if (contentType.startsWith("multipart/form-data")) {
    // Multer parse form-data
    upload.any()(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.files || req.files.length === 0) return next();

      try {
        // Upload tất cả file lên Cloudinary song song
        const uploadedFiles = await Promise.all(
          req.files.map((file) =>
            new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                { folder: "uploads", resource_type: "auto" },
                (error, result) => (error ? reject(error) : resolve(result))
              );
              streamifier.createReadStream(file.buffer).pipe(uploadStream);
            })
          )
        );

        req.uploadedFiles = uploadedFiles; // lưu thông tin file đã upload
        next();
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    });
  } else {
    // Không phải form-data -> bỏ qua
    next();
  }
};

module.exports = uploadCloudinary;
