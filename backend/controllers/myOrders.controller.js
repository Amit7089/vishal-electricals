
import mongoose from "mongoose";
import Order from "../models/order.model.js";

// GET /api/orders/my
export const getMyOrders = async (req, res) => {
  try {
    // Auth middleware se logged-in user ki ID
    const userId = req.user?.id || req.user?._id;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Please log in to view your orders.",
      });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number(req.query.limit) || 10)
    );

    const filter = {
      user: new mongoose.Types.ObjectId(userId),
    };

    // Temporary debugging logs
    console.log("My Orders - Logged-in user:", String(userId));

    const totalOrders = await Order.countDocuments(filter);

    console.log("My Orders - Matching count:", totalOrders);

    const orders = await Order.find(filter)
      .select("-razorpaySignature")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
      },
    });
  } catch (error) {
    console.error("Get my orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your orders.",
    });
  }
};
