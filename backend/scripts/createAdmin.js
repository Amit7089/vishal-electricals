
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const createAdmin = async () => {
  try {
    // Check required environment variables
    const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } =
      process.env;

    if (!MONGO_URI || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error(
        "Please configure MONGO_URI, ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env"
      );
    }

    if (ADMIN_PASSWORD.length < 12) {
      throw new Error("Admin password must be at least 12 characters");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in .env");
    }

    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected for admin setup");

    const email = ADMIN_EMAIL.trim().toLowerCase();

    // Check whether the account already exists
    let user = await User.findOne({ email }).select("+password");

    if (user) {
      // Do not silently convert an existing customer account
      if (user.role !== "admin") {
        throw new Error(
          "This email already belongs to a customer. Use a separate admin email."
        );
      }

      console.log("Admin account already exists.");
    } else {
      user = await User.create({
        name: ADMIN_NAME.trim(),
        email,
        password: ADMIN_PASSWORD,
        role: "admin",
        isActive: true,
      });

      console.log("Admin account created successfully.");
    }

    console.log("Admin email:", user.email);
  } catch (error) {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
};

createAdmin();
