
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import adminProductRoutes from "./routes/admin.product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import adminOrderRoutes from "./routes/adminOrder.routes.js";
import myOrdersRoutes from "./routes/myOrders.routes.js";

// New routes
import wishlistRoutes from "./routes/wishlist.routes.js";
import reviewRoutes from "./routes/review.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Global middleware
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// API home route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Vishal Electricals API is running!",
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is healthy",
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Public product routes
app.use("/api/products", productRoutes);

// Admin product routes
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/admin/orders", adminOrderRoutes);

// Customer order routes
app.use("/api/orders", orderRoutes);
app.use("/api/orders", myOrdersRoutes);

// Wishlist routes
app.use("/api/wishlist", wishlistRoutes);

// Product review routes
app.use("/api/reviews", reviewRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl,
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Server error:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// Start server after database connection
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `Vishal Electricals API running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
