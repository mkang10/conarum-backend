const express = require("express");
const cds = require("@sap/cds");
const uploadCloudinary = require("./middleware/upload");

const router = express.Router();

// POST /MEAL_SRV/upload-meal
router.post("/MEAL_SRV/upload-meal", uploadCloudinary, async (req, res) => {
  try {
    const { Name, Description, Price, VendorName, VendorPhone, VendorAddr } =
      req.body;
    const file = req.uploadedFiles?.[0];

    if (!Name || !Price)
      return res.status(400).json({ error: "Name and Price required" });
    if (!file) return res.status(400).json({ error: "File missing" });

    //Thực hiện INSERT
    const inserted = await cds.run(
      INSERT.into("Meals").entries({
        Name,
        Description,
        Price: parseFloat(Price),
        ImageUrl: file?.secure_url || null,
        VendorName,
        VendorPhone,
        VendorAddr,
        createdBy: req.user?.ID || "system",
        modifiedBy: req.user?.ID || "system",
        createdAt: new Date(),
        modifiedAt: new Date(),
      })
    );

    console.log("Raw CAP inserted result:", inserted);

    //Tự tạo response vì CAP không trả về bản ghi (chỉ trả về { changes: 1 })
    const now = new Date().toISOString();
    const newMeal = {
      "@odata.context": "$metadata#Meals/$entity",
      Name,
      Description,
      Price: parseFloat(Price),
      ImageUrl: file.secure_url,
      VendorName,
      VendorPhone,
      VendorAddr,
      createdAt: now,
      createdBy: req.user?.ID || "system",
      modifiedAt: now,
      modifiedBy: req.user?.ID || "system",
    };

    res.status(201).json(newMeal);
  } catch (err) {
    console.error("Upload Meal error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
