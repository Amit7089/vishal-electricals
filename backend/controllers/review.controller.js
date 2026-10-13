
import mongoose from "mongoose";
import Review from "../models/review.js";
import Product from "../models/product.js";

// Get all reviews for a product
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product nahi mila",
      });
    }

    const reviews = await Review.find({ product: productId })
      .populate("user", "name fullName")
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;

    const averageRating = totalReviews
      ? Number(
          (
            reviews.reduce((sum, review) => sum + review.rating, 0) /
            totalReviews
          ).toFixed(1)
        )
      : 0;

    return res.status(200).json({
      success: true,
      totalReviews,
      averageRating,
      reviews,
    });
  } catch (error) {
    console.error("Get product reviews error:", error);

    return res.status(500).json({
      success: false,
      message: "Reviews load nahi hue",
    });
  }
};

// Add a review for a product
export const addProductReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const rating = Number(req.body?.rating);
    const comment =
      typeof req.body?.comment === "string"
        ? req.body.comment.trim()
        : "";

    // Validate product ID
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Check login
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Review dene ke liye login karein",
      });
    }

    // Validate rating
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating 1 se 5 stars ke beech honi chahiye",
      });
    }

    // Validate comment
    if (comment.length < 3 || comment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Review 3 se 1000 characters ka hona chahiye",
      });
    }

    // Check product exists
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product nahi mila",
      });
    }

    // Create review
    const review = await Review.create({
      product: productId,
      user: userId,
      rating,
      comment,
    });

    await review.populate("user", "name fullName");

    return res.status(201).json({
      success: true,
      message: "Review submit ho gaya",
      review,
    });
  } catch (error) {
    console.error("Review submit error:", error);

    // Duplicate review
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Aap is product par pehle hi review de chuke hain",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Review submit nahi hua",
    });
  }
};
