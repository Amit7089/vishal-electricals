
import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getProductReviews,
  addProductReview,
} from "../controllers/review.controller.js";

const router = express.Router();

router.get("/:productId", getProductReviews);
router.post("/:productId", protect, addProductReview);

export default router;
