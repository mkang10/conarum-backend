const cds = require("@sap/cds");

/**
 * MealService implementation
 * Xử lý nghiệp vụ liên quan đến Meals
 */
module.exports = cds.service.impl(async function () {
  const { Menus, MenuMeals, Meals } = this.entities;

  /**
   * Custom action: Lấy danh sách món ăn theo giá tối thiểu
   * Sử dụng trong app UI5 hoặc gọi trực tiếp qua OData action
   * Ví dụ: POST /meal/getMealsByMinPrice
   */
  this.on("getMealsByMinPrice", async (req) => {
    const minPrice = req.data.minPrice ?? 100000;
    const meals = await cds.run(
      SELECT.from(Meals).where({ Price: { ">=": minPrice } })
    );
    return meals;
  });

  /**
   * Event: Before insert Meal → validate dữ liệu
   */
  this.before("CREATE", Meals, async (req) => {
    const { Name, Price } = req.data;
    let { imageBase64, ImageUrl } = req.data;

    if (!Name || Price <= 0) {
      req.reject(400, "Tên món ăn và giá tiền phải hợp lệ!");
      return;
    }

    // Nếu client gửi file Base64
    if (imageBase64) {
      try {
        // Tạo buffer từ Base64
        const buffer = Buffer.from(imageBase64, "base64");

        // Lưu tạm file
        const tempPath = path.join(
          __dirname,
          "images",
          `${Name.replace(/\s+/g, "_")}.jpg`
        );
        fs.writeFileSync(tempPath, buffer);

        // Upload lên Cloudinary
        const upload = await cloudinary.uploader.upload(tempPath, {
          folder: "meals",
          public_id: Name.replace(/\s+/g, "_").toLowerCase(),
          overwrite: true,
        });

        req.data.ImageUrl = upload.secure_url;
        fs.unlinkSync(tempPath); // xóa file tạm
      } catch (err) {
        console.error("❌ Upload ảnh thất bại:", err);
        req.reject(500, "Không thể upload ảnh lên Cloudinary!");
      }
    }

    // Nếu client gửi đường dẫn file trên server (ImageUrl)
    else if (ImageUrl) {
      const localPath = path.join(__dirname, "images", ImageUrl);
      if (!fs.existsSync(localPath)) {
        req.reject(400, `Ảnh không tồn tại: ${ImageUrl}`);
        return;
      }

      try {
        const upload = await cloudinary.uploader.upload(localPath, {
          folder: "meals",
          public_id: Name.replace(/\s+/g, "_").toLowerCase(),
          overwrite: true,
        });
        req.data.ImageUrl = upload.secure_url;
      } catch (err) {
        console.error("❌ Upload ảnh thất bại:", err);
        req.reject(500, "Không thể upload ảnh lên Cloudinary!");
      }
    }
  });

  /**
   * Event: After create → log ra console
   */
  this.after("CREATE", Meals, (data) => {
    console.log(`✅ Meal created: ${data.Name} (${data.ID})`);
  });

  //AssignMeal
  this.on("AssignMealToMenu", async (req) => {
    const { MenuID, MealID } = req.data;

    // Kiểm tra menu tồn tại
    const menu = await SELECT.one.from(Menus).where({ ID: MenuID });
    if (!menu) return req.error(404, "Menu không tồn tại");

    // Kiểm tra món ăn tồn tại
    const meal = await SELECT.one.from(Meals).where({ ID: MealID });
    if (!meal) return req.error(404, "Món ăn không tồn tại");

    // Kiểm tra trùng lặp
    const exists = await SELECT.one
      .from(MenuMeals)
      .where({ Menu_ID: MenuID, Meal_ID: MealID });
    if (exists) return req.error(400, "Món ăn đã được gán cho menu này");

    // Tạo mới liên kết
    const result = await INSERT.into(MenuMeals).entries({
      Menu_ID: MenuID,
      Meal_ID: MealID,
    });

    return result;
  });

  // Lấy menu hôm nay
  this.on("GetTodayMenu", async (req) => {
    const today = new Date().toISOString().split("T")[0];
    const menu = await SELECT.one.from(Menus).where({ Date: today });
    if (!menu) return req.error(404, "Chưa có menu hôm nay");
    menu.meals = await SELECT.from(MenuMeals)
      .where({ Menu_ID: menu.ID })
      .columns("Meal_ID");
    return menu;
  });

  this.on("BulkUpdateMenus", async (req) => {
    const { updates } = req.data;

    if (!Array.isArray(updates) || updates.length === 0) {
      return req.reject(400, "No updates provided");
    }

    for (const item of updates) {
      await UPDATE(Menus, item.ID).with(item);
    }

    return { success: true, count: updates.length };
  });

  this.on("BulkUpdateMeals", async (req) => {
    const { updates } = req.data;

    if (!Array.isArray(updates) || updates.length === 0) {
      return req.reject(400, "No updates provided");
    }

    for (const item of updates) {
      await UPDATE(Meals, item.ID).with(item);
    }

    return { success: true, count: updates.length };
  });
  
  this.on("createMenuWithMeals", async (req) => {
    const { Date, Status, TotalOrders, meals } = req.data;

    // --- 1️⃣ Kiểm tra ngày đã tồn tại ---
    const existing = await cds.run(SELECT.one.from(Menus).where({ Date }));

    if (existing) {
      req.error(
        400,
        `Thực đơn cho ngày ${Date} đã tồn tại, không thể tạo thêm.`
      );
    }

    // --- 2️⃣ Tạo Menu mới ---
    const [menu] = await cds.run(
      INSERT.into(Menus).entries({ Date, Status, TotalOrders })
    );

    // --- 3️⃣ Tạo các món ăn trong thực đơn ---
    for (const m of meals) {
      await cds.run(
        INSERT.into(MenuMeals).entries({
          Menu_ID: menu.ID,
          Meal_ID: m.Meal.ID,
          IsAvailable: m.IsAvailable,
        })
      );
    }

    return { ...menu, meals };
  });
});
