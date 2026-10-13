
import User from "../models/User.js";

const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Please log in first",
      });
    }

    const user = await User.findById(req.user.id).select(
      "_id role isActive"
    );

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account not found or inactive",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only",
      });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify admin access",
    });
  }
};

export default adminMiddleware;