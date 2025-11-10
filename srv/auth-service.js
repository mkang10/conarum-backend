const cds = require("@sap/cds");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports = cds.service.impl(async function () {
  const { Users } = this.entities;

  // Hàm kiểm tra email hợp lệ (đuôi @conarum.com)
  function validateConarumEmail(email) {
    const pattern = /^[^\s@]+@conarum\.com$/i;
    return pattern.test(email);
  }

  // ===== LOGIN =====
  this.on("login", async (req) => {
    const { Email, Password } = req.data;

    if (!Email || !Password) {
      return req.reject(400, "Vui lòng nhập Email và Mật khẩu.");
    }

    if (!validateConarumEmail(Email)) {
      return req.reject(400, "Chỉ chấp nhận email có đuôi @conarum.com");
    }

    const user = await cds.run(SELECT.one.from(Users).where({ Email }));
    if (!user) return req.reject(401, "Email không tồn tại!");

    const match = await bcrypt.compare(Password, user.Password);
    if (!match) return req.reject(401, "Sai mật khẩu!");

    const token = jwt.sign(
      {
        ID: user.ID,
        Role: user.Role,
        Name: user.Name,
        Department: user.Department,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return {
      token,
      role: user.Role,
      name: user.Name,
      department: user.Department,
    };
  });

  // ===== REGISTER =====
  this.on("register", async (req) => {
    const { Name, Email, Password, Role, Department } = req.data || {};

    if (!Name || !Email || !Password) {
      return req.reject(400, "Thiếu thông tin bắt buộc (Name, Email, Password)");
    }

    if (!validateConarumEmail(Email)) {
      return req.reject(400, "Chỉ chấp nhận đăng ký bằng email @conarum.com");
    }

    const existing = await cds.run(SELECT.one.from(Users).where({ Email }));
    if (existing) return req.reject(400, "Email đã được sử dụng!");

    const hashedPassword = await bcrypt.hash(Password, 10);

    const newUser = {
      ID: cds.utils.uuid(),
      Name,
      Email,
      Password: hashedPassword,
      Role: Role || "Employee",
      Department: Department || "General",
    };

    await cds.run(INSERT.into(Users).entries(newUser));

    const token = jwt.sign(
      {
        ID: newUser.ID,
        Role: newUser.Role,
        Name: newUser.Name,
        Department: newUser.Department,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return {
      message: "Đăng ký thành công!",
      token,
      role: newUser.Role,
      name: newUser.Name,
      department: newUser.Department,
    };
  });
});
