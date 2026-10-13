
import mongoose from "mongoose";
import Wishlist from "../models/wishlist.js";
import Product from "../models/product.js";

export const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate("products");

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user._id,
        products: [],
      });
    }

    res.status(200).json({ success: true, wishlist });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Wishlist load nahi hui",
    });
  }
};

export const addToWishlist = async (req, res) => {
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

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $addToSet: { products: product._id } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("products");

    res.status(200).json({
      success: true,
      message: "Product wishlist mein add ho gaya",
      wishlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Wishlist mein product add nahi hua",
    });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { products: productId } },
      { new: true }
    ).populate("products");

    res.status(200).json({
      success: true,
      message: "Product wishlist se remove ho gaya",
      wishlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Wishlist update nahi hui",
    });
  }
};