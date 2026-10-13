
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    // Basic product information
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },

    sku: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
    },

    description: {
      type: String,
      default: "",
      maxlength: 10000,
    },

    shortDescription: {
      type: String,
      default: "",
      maxlength: 500,
    },

    // Category and brand
    category: {
      type: String,
      required: [true, "Product category is required"],
      trim: true,
      index: true,
    },

    subcategory: {
      type: String,
      default: "",
      trim: true,
    },

    brand: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    model: {
      type: String,
      default: "",
      trim: true,
    },

    // Pricing in INR
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },

    compareAtPrice: {
      type: Number,
      default: null,
      min: 0,
    },

    costPrice: {
      type: Number,
      default: null,
      min: 0,
      select: false,
    },

    // Inventory
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number",
      },
    },

    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },

    trackInventory: {
      type: Boolean,
      default: true,
    },

    allowBackorder: {
      type: Boolean,
      default: false,
    },

    // Product images
    images: [
      {
        url: {
          type: String,
          required: true,
          trim: true,
        },
        publicId: {
          type: String,
          default: "",
        },
        alt: {
          type: String,
          default: "",
        },
      },
    ],

    // Electrical product specifications
    specifications: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        value: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],

    warranty: {
      duration: {
        type: Number,
        default: 0,
        min: 0,
      },
      unit: {
        type: String,
        enum: ["days", "months", "years"],
        default: "months",
      },
      description: {
        type: String,
        default: "",
      },
    },

    // Shipping and product dimensions
    weight: {
      type: Number,
      default: 0,
      min: 0,
    },

    dimensions: {
      length: { type: Number, default: 0, min: 0 },
      width: { type: Number, default: 0, min: 0 },
      height: { type: Number, default: 0, min: 0 },
    },

    // Visibility and merchandising
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isBestSeller: {
      type: Boolean,
      default: false,
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    numReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    // SEO
    metaTitle: {
      type: String,
      default: "",
      maxlength: 70,
    },

    metaDescription: {
      type: String,
      default: "",
      maxlength: 160,
    },

    // Admin user ID who created this product
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Search and filtering indexes
productSchema.index({
  name: "text",
  description: "text",
  brand: "text",
  tags: "text",
});

productSchema.index({
  category: 1,
  isActive: 1,
  price: 1,
});

productSchema.index({
  isActive: 1,
  createdAt: -1,
});

// Reuse existing model if already registered
const Product =
  mongoose.models.Product ||
  mongoose.model("Product", productSchema);

export default Product;
