// srv/server.js
const express = require('express');
const mealUploadRouter = require("./meal-upload.js"); 
const cds = require("@sap/cds");
const authMiddleware = require("./middleware/auth.js");
const corsMiddleware = require("./middleware/cors.js");

cds.on("bootstrap", (app) => {
  // Nên đặt parse body lên trước
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS + Auth
  app.use(corsMiddleware);
  app.use(authMiddleware);

  // Chỉ mount router upload ảnh riêng biệt
  app.use("/", mealUploadRouter);
});

module.exports = cds.server;
