
import express from "express";
import { getMyOrders } from "../controllers/myOrders.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/my", protect, getMyOrders);

export default router;
