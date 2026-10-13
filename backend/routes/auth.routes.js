
import express from "express";

import {
  register,
  login,
  logout,
  getMe,
} from "../controllers/auth.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Register new customer
router.post("/register", register);

// Login customer
router.post("/login", login);

// Logout current user
router.post("/logout", logout);

// Get logged-in user's profile
router.get("/me", protect, getMe);

export default router;
