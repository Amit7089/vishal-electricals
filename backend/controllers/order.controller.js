
import mongoose from "mongoose";
import Razorpay from "razorpay";
import { createHmac, timingSafeEqual } from "node:crypto";

import Product from "../models/Product.js";
import Order from "../models/order.model.js";

const formatImage = (product) => {
  const firstImage = product.images?.[0];

  if (typeof firstImage === "string") return firstImage;
  return firstImage?.url || "";
};

const generateOrderNumber = () =>
  `VE${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

// Use the ID created by the protect middleware.
const getAuthenticatedUserId = (req) => {
  const rawId = req.user?.id || req.user?._id;

  if (!rawId || !mongoose.isValidObjectId(rawId)) {
    return null;
  }

  return new mongoose.Types.ObjectId(rawId);
};

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEYS_MISSING");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

const orderResponse = (order) => ({
  _id: order._id,
  orderNumber: order.orderNumber,
  items: order.items,
  shippingAddress: order.shippingAddress,
  subtotal: order.subtotal,
  deliveryCharge: order.deliveryCharge,
  totalAmount: order.totalAmount,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  orderStatus: order.orderStatus,
  razorpayOrderId: order.razorpayOrderId || "",
  createdAt: order.createdAt,
});

const restoreStock = async (reservations = []) => {
  for (const reservation of reservations) {
    await Product.updateOne(
      { _id: reservation.productId },
      { $inc: { stock: reservation.quantity } }
    );
  }
};

// POST /api/orders
// Route: router.post("/", protect, createOrder)
export const createOrder = async (req, res) => {
  const reservedStock = [];
  let savedOrder = null;
  let orderPersisted = false;

  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in before placing an order.",
      });
    }

    const {
      items,
      shippingAddress,
      paymentMethod = "cod",
      notes = "",
    } = req.body;

    if (!["cod", "online"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method.",
      });
    }

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty or contains too many products.",
      });
    }

    const requiredFields = [
      "fullName",
      "phone",
      "address",
      "city",
      "state",
      "pincode",
    ];

    for (const field of requiredFields) {
      if (
        typeof shippingAddress?.[field] !== "string" ||
        !shippingAddress[field].trim()
      ) {
        return res.status(400).json({
          success: false,
          message: `Please provide ${field}.`,
        });
      }
    }

    const phone = shippingAddress.phone.replace(/\D/g, "");
    const pincode = shippingAddress.pincode.trim();

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit Indian mobile number.",
      });
    }

    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 6-digit PIN code.",
      });
    }

    // Merge duplicate product IDs and validate quantities.
    const quantityMap = new Map();

    for (const item of items) {
      const productId = item.productId || item.product;
      const quantity = Number(item.quantity);

      if (
        !mongoose.isValidObjectId(productId) ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > 1000
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product or quantity in your cart.",
        });
      }

      const id = String(productId);
      const newQuantity = (quantityMap.get(id) || 0) + quantity;

      if (newQuantity > 1000) {
        return res.status(400).json({
          success: false,
          message: "Maximum quantity per product is 1000.",
        });
      }

      quantityMap.set(id, newQuantity);
    }

    const productIds = [...quantityMap.keys()];

    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message:
          "One or more products are unavailable. Refresh your cart.",
      });
    }

    const orderItems = [];
    let subtotal = 0;

    for (const product of products) {
      const quantity = quantityMap.get(String(product._id));
      const price = Number(product.price);

      if (!Number.isFinite(price) || price <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid price for ${product.name}.`,
        });
      }

      if (
        product.trackInventory !== false &&
        (!Number.isFinite(Number(product.stock)) ||
          Number(product.stock) < quantity)
      ) {
        return res.status(400).json({
          success: false,
          message: `${product.name} does not have enough stock. Available: ${product.stock ?? 0}.`,
        });
      }

      const lineTotal = Math.round(price * quantity * 100) / 100;
      subtotal += lineTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku || "",
        image: formatImage(product),
        price,
        quantity,
        lineTotal,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;

    const deliveryCharge = 0;
    const totalAmount =
      Math.round((subtotal + deliveryCharge) * 100) / 100;

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "The order total must be greater than zero.",
      });
    }

    // Reserve stock atomically.
    for (const product of products) {
      if (product.trackInventory === false) continue;

      const quantity = quantityMap.get(String(product._id));

      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: product._id,
          isActive: true,
          stock: { $gte: quantity },
        },
        { $inc: { stock: -quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        throw new Error(`STOCK_CHANGED:${product.name}`);
      }

      reservedStock.push({
        productId: product._id,
        quantity,
      });
    }

    let razorpayOrder = null;

    if (paymentMethod === "online") {
      const razorpay = getRazorpay();

      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: generateOrderNumber(),
        notes: {
          store: "Vishal Electricals",
          customerId: String(userId),
        },
      });
    }

    savedOrder = new Order({
      orderNumber: generateOrderNumber(),

      // Always associate this order with the authenticated account.
      user: userId,

      items: orderItems,
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        phone,
        email:
          typeof shippingAddress.email === "string"
            ? shippingAddress.email.trim().toLowerCase()
            : "",
        address: shippingAddress.address.trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        pincode,
      },
      subtotal,
      deliveryCharge,
      totalAmount,
      paymentMethod,
      paymentStatus: "pending",
      orderStatus: paymentMethod === "cod" ? "confirmed" : "pending",
      razorpayOrderId: razorpayOrder?.id || "",
      razorpayPaymentId: "",
      razorpaySignature: "",
      stockReservations: reservedStock,
      inventoryRestored: false,
      notes: typeof notes === "string" ? notes.slice(0, 1000) : "",
    });

    await savedOrder.save();
    orderPersisted = true;

    console.log(
      "Order created:",
      savedOrder.orderNumber,
      "Customer:",
      String(savedOrder.user)
    );

    return res.status(201).json({
      success: true,
      message:
        paymentMethod === "cod"
          ? "Your order has been placed successfully."
          : "Razorpay order created. Complete the payment.",
      order: orderResponse(savedOrder),
      ...(razorpayOrder
        ? {
            razorpay: {
              keyId: process.env.RAZORPAY_KEY_ID,
              orderId: razorpayOrder.id,
              amount: razorpayOrder.amount,
              currency: razorpayOrder.currency,
            },
          }
        : {}),
    });
  } catch (error) {
    console.error("Create order error:", error);

    if (error.message === "RAZORPAY_KEYS_MISSING") {
      try {
        await restoreStock(reservedStock);
      } catch (restoreError) {
        console.error("Stock rollback failed:", restoreError);
      }

      return res.status(503).json({
        success: false,
        message:
          "Razorpay keys are missing in backend environment settings.",
      });
    }

    if (error.message?.startsWith("STOCK_CHANGED:")) {
      try {
        await restoreStock(reservedStock);
      } catch (restoreError) {
        console.error("Stock rollback failed:", restoreError);
      }

      return res.status(409).json({
        success: false,
        message: `${error.message.replace("STOCK_CHANGED:", "")} stock has changed. Please try again.`,
      });
    }

    if (!orderPersisted) {
      if (savedOrder?._id) {
        try {
          await Order.deleteOne({ _id: savedOrder._id });
        } catch (cleanupError) {
          console.error("Order cleanup failed:", cleanupError);
        }
      }

      try {
        await restoreStock(reservedStock);
      } catch (restoreError) {
        console.error("Stock rollback failed:", restoreError);
      }
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to place your order right now. Please try again.",
    });
  }
};

// POST /api/orders/verify-payment
// Route: router.post("/verify-payment", protect, verifyPayment)
export const verifyPayment = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to verify this payment.",
      });
    }

    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !mongoose.isValidObjectId(orderId) ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are incomplete.",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: userId,
    });

    if (!order || order.paymentMethod !== "online") {
      return res.status(404).json({
        success: false,
        message: "Online order not found for this account.",
      });
    }

    if (order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order does not match this purchase.",
      });
    }

    if (
      order.paymentStatus === "paid" &&
      order.razorpayPaymentId === razorpay_payment_id
    ) {
      return res.status(200).json({
        success: true,
        message: "Payment has already been verified.",
        order: orderResponse(order),
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return res.status(503).json({
        success: false,
        message: "Razorpay secret is not configured on the server.",
      });
    }

    const expectedSignature = createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const received = Buffer.from(razorpay_signature, "utf8");
    const expected = Buffer.from(expectedSignature, "utf8");

    if (
      received.length !== expected.length ||
      !timingSafeEqual(received, expected)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed.",
      });
    }

    const razorpay = getRazorpay();
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      payment.order_id !== order.razorpayOrderId ||
      payment.currency !== "INR" ||
      payment.amount !== Math.round(order.totalAmount * 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment amount or order details do not match.",
      });
    }

    if (payment.status !== "captured") {
      return res.status(409).json({
        success: false,
        message:
          "Payment is not captured yet. Check the payment status before retrying.",
      });
    }

    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        user: userId,
        paymentMethod: "online",
        paymentStatus: "pending",
        razorpayOrderId: razorpay_order_id,
      },
      {
        $set: {
          paymentStatus: "paid",
          orderStatus: "confirmed",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      const latestOrder = await Order.findOne({
        _id: order._id,
        user: userId,
      });

      if (
        latestOrder?.paymentStatus === "paid" &&
        latestOrder.razorpayPaymentId === razorpay_payment_id
      ) {
        return res.status(200).json({
          success: true,
          message: "Payment has already been verified.",
          order: orderResponse(latestOrder),
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "Order status changed. If money was deducted, check payment status before retrying.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      order: orderResponse(updatedOrder),
    });
  } catch (error) {
    console.error("Verify payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment right now.",
    });
  }
};

// POST /api/orders/:id/cancel-payment
// Route: router.post("/:id/cancel-payment", protect, cancelOnlineOrder)
export const cancelOnlineOrder = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to cancel this order.",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!order || order.paymentMethod !== "online") {
      return res.status(404).json({
        success: false,
        message: "Online order not found for this account.",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(409).json({
        success: false,
        message:
          "A paid order cannot be cancelled through this endpoint.",
      });
    }

    if (order.orderStatus === "cancelled") {
      return res.status(200).json({
        success: true,
        message: "Order is already cancelled.",
        order: orderResponse(order),
      });
    }

    order.orderStatus = "cancelled";
    order.paymentStatus = "failed";

    if (!order.inventoryRestored) {
      order.inventoryRestored = true;
      await order.save();

      await restoreStock(order.stockReservations || []);
    } else {
      await order.save();
    }

    return res.status(200).json({
      success: true,
      message: "Online order cancelled.",
      order: orderResponse(order),
    });
  } catch (error) {
    console.error("Cancel online order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel the order right now.",
    });
  }
};
