
import express from "express";
import {
  createOrder,
  verifyPayment,
  cancelOnlineOrder,
} from "../controllers/order.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Order create karne ke liye login zaroori hai
router.post("/", protect, createOrder);

// Payment verify karne ke liye login zaroori hai
router.post("/verify-payment", protect, verifyPayment);

// Unpaid online order cancel karne ke liye login zaroori hai
router.post("/:id/cancel-payment", protect, cancelOnlineOrder);

export default router;
