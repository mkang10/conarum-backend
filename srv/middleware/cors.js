const cors = require("cors");

const corsMiddleware = cors({
  origin: ["http://localhost:3000", "http://localhost:6969"], // hoặc '*' cho dev
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});

module.exports = corsMiddleware;
