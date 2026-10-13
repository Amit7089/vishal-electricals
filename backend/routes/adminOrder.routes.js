
import express from "express";

import {
  getAdminOrders,
  getAdminOrderById,
  updateAdminOrderStatus,
} from "../controllers/adminOrder.controller.js";

import {
  protect,
  adminOnly,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// Every route requires an authenticated admin
router.use(protect, adminOnly);

// GET all orders
router.get("/", getAdminOrders);

// GET single order details
router.get("/:id", getAdminOrderById);

// UPDATE order status
router.patch("/:id/status", updateAdminOrderStatus);

export default router;
