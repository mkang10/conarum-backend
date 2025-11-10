const cds = require("@sap/cds");
const jwt = require("jsonwebtoken");
const ROLE_MAP = require("../types/rolemap.js");

require("dotenv").config();

module.exports = function authMiddleware(req, res, next) {
  console.log("🔍 Middleware hit:", req.path);

  // Các endpoint public (bỏ qua xác thực)
  if (
    req.originalUrl.startsWith("/AUTH_SRV/login") ||
    req.originalUrl.startsWith("/AUTH_SRV/register") ||
    req.originalUrl.startsWith("/AUTH_SRV/Users") ||
    req.path === "/"
  ) {
    return next();
  }

  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "Thiếu Authorization header" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Thiếu token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // implement user information
    // mapping
    const roleName = ROLE_MAP[Number(decoded.Role)];
    console.log("🧩 Decoded token:", decoded);
    console.log(Object.keys(ROLE_MAP)); // ['0','1','2'] hay [0,1,2] ?

    // CAP yêu cầu tạo user instance đúng chuẩn
    req.user = new cds.User({
      id: decoded.ID,
      roles: [roleName],
    });

    console.log("Gán user vào req:", req.user.id, req.user.roles);
    next();
  } catch (err) {
    console.error("JWT verify failed:", err.message);
    res.status(403).json({ error: "Token không hợp lệ hoặc đã hết hạn" });
  }
};
