
import express from "express";

import {
  getProducts,
  getProductById,
  getProductCategories,
  getProductBrands,
} from "../controllers/product.controller.js";

const router = express.Router();

// Specific routes must come before /:id
router.get("/categories", getProductCategories);
router.get("/brands", getProductBrands);

// Product listing with search, filters, sorting and pagination
router.get("/", getProducts);

// Product details by MongoDB ID or slug
router.get("/:id", getProductById);

export default router;
