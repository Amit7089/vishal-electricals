
import express from "express";

import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/admin.product.controller.js";

import {
  uploadProductImage,
} from "../controllers/admin.upload.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import adminMiddleware from "../middleware/admin.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// Only authenticated admins can access these routes
router.use(protect, adminMiddleware);

// Upload product image from computer
router.post(
  "/upload-image",
  upload.single("image"),
  uploadProductImage
);

// Create product
router.post("/", createProduct);

// Update product
router.put("/:id", updateProduct);

// Delete product
router.delete("/:id", deleteProduct);

export default router;
