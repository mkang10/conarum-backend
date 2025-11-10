// src/routes/meal.route.js
const express = require("express");
const uploadCloudinary = require("../middleware/upload");
const mealController = require("../controllers/meal.controller");

const router = express.Router();

router.post("/MEAL_SRV/upload-meal", uploadCloudinary, mealController.createMeal);

module.exports = router;
