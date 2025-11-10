const { v2: cloudinary } = require("cloudinary");
const streamifier = require("streamifier");
const mealService = require("../services/meal.service");

exports.createMeal = async (req, res) => {
  try {
    const { Name, Description, Price, Vendor_ID } = req.body;
    const file = req.file; // Multer đính kèm ở đây

    if (!Name || !Price) {
      return res.status(400).json({ error: "Name and Price are required" });
    }

    if (!file) {
      return res.status(400).json({ error: "Image file is missing" });
    }

    // ✅ Upload file lên Cloudinary
    const uploadToCloudinary = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "meals" }, // tùy chọn
          (error, result) => (error ? reject(error) : resolve(result))
        );
        streamifier.createReadStream(file.buffer).pipe(stream);
      });

    const uploaded = await uploadToCloudinary();

    // ✅ Lưu meal vào DB
    const meal = await mealService.createMeal({
      Name,
      Description,
      Price: parseFloat(Price),
      Vendor_ID: Vendor_ID || null,
      ImageUrl: uploaded.secure_url,
      createdBy: req.user?.ID || "system",
    });

    // ✅ Chuẩn hóa response
    return res.status(201).json({
      "@odata.context": "$metadata#Meals/$entity",
      ...meal,
    });
  } catch (err) {
    console.error("❌ Create meal failed:", err);
    return res.status(500).json({ error: err.message });
  }
};
