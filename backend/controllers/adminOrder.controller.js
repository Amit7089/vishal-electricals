
import mongoose from "mongoose";
import Order from "../models/order.model.js";

// Allowed order statuses
const allowedStatuses = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

// GET /api/admin/orders
// Admin can view all orders with filters and pagination
export const getAdminOrders = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

    const filter = {};

    if (
      req.query.status &&
      allowedStatuses.includes(req.query.status)
    ) {
      filter.orderStatus = req.query.status;
    }

    if (
      req.query.paymentStatus &&
      ["pending", "paid", "failed", "refunded"].includes(
        req.query.paymentStatus
      )
    ) {
      filter.paymentStatus = req.query.paymentStatus;
    }

    if (
      req.query.paymentMethod &&
      ["cod", "online"].includes(req.query.paymentMethod)
    ) {
      filter.paymentMethod = req.query.paymentMethod;
    }

    if (req.query.search?.trim()) {
      const search = req.query.search.trim();
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
      const regex = new RegExp(escapedSearch, "i");

      filter.$or = [
        { orderNumber: regex },
        { "shippingAddress.name": regex },
        { "shippingAddress.phone": regex },
        { "shippingAddress.email": regex },
      ];
    }

    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .select("-razorpaySignature")
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Order.countDocuments(filter),
    ]);

    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    statusCounts.forEach((item) => {
      counts[item._id] = item.count;
    });

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      orders,
      pagination: {
        page,
        limit,
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
      },
      counts,
    });
  } catch (error) {
    console.error("Get admin orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders",
    });
  }
};

// GET /api/admin/orders/:id
// Get a single order
export const getAdminOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(id)
      .select("-razorpaySignature")
      .populate("user", "name email")
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get admin order details error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch order details",
    });
  }
};

// PATCH /api/admin/orders/:id/status
// Update order status
export const updateAdminOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
        allowedStatuses,
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.orderStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled orders cannot be reopened",
      });
    }

    if (
      order.orderStatus === "delivered" &&
      orderStatus !== "delivered"
    ) {
      return res.status(400).json({
        success: false,
        message: "Delivered orders cannot be changed",
      });
    }

    if (
      ["processing", "shipped", "delivered"].includes(orderStatus) &&
      order.paymentMethod === "online" &&
      order.paymentStatus !== "paid"
    ) {
      return res.status(400).json({
        success: false,
        message: "Online payment must be verified before processing",
      });
    }

    if (
      orderStatus === "cancelled" &&
      order.paymentStatus === "paid"
    ) {
      return res.status(400).json({
        success: false,
        message: "Refund the paid order before cancelling it",
      });
    }

    order.orderStatus = orderStatus;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update admin order status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update order status",
    });
  }
};
