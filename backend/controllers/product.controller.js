
import mongoose from "mongoose";
import Product from "../models/Product";

// Escape special characters before creating a regular expression
const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/products
// Public product listing with search, filters, sorting and pagination
export const getProducts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 12)
    );

    const filter = {
      isActive: true,
    };

    // Category filter
    if (req.query.category?.trim()) {
      filter.category = req.query.category.trim();
    }

    // Brand filter
    if (req.query.brand?.trim()) {
      filter.brand = req.query.brand.trim();
    }

    // Featured filter
    if (req.query.featured === "true") {
      filter.isFeatured = true;
    }

    // Bestseller filter
    if (req.query.bestSeller === "true") {
      filter.isBestSeller = true;
    }

    // In-stock filter
    if (req.query.inStock === "true") {
      filter.stock = { $gt: 0 };
    }

    // Minimum and maximum price
    const minPrice = Number(req.query.minPrice);
    const maxPrice = Number(req.query.maxPrice);

    const hasMinPrice =
      req.query.minPrice !== undefined &&
      req.query.minPrice !== "" &&
      Number.isFinite(minPrice);

    const hasMaxPrice =
      req.query.maxPrice !== undefined &&
      req.query.maxPrice !== "" &&
      Number.isFinite(maxPrice);

    if (hasMinPrice || hasMaxPrice) {
      filter.price = {};

      if (hasMinPrice) {
        filter.price.$gte = minPrice;
      }

      if (hasMaxPrice) {
        filter.price.$lte = maxPrice;
      }
    }

    // Case-insensitive partial search
    // Searches product name, description, brand and tags
    const searchTerm = req.query.search?.trim();

    if (searchTerm) {
      const searchRegex = new RegExp(escapeRegex(searchTerm), "i");

      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { shortDescription: searchRegex },
        { brand: searchRegex },
        { tags: searchRegex },
        { sku: searchRegex },
        { category: searchRegex },
        { subcategory: searchRegex },
        { model: searchRegex },
      ];
    }

    // Sorting
    const sortOptions = {
      newest: { createdAt: -1 },
      price_low: { price: 1 },
      price_high: { price: -1 },
      name: { name: 1 },
      popular: { numReviews: -1, averageRating: -1 },
      discount: { compareAtPrice: -1 },
    };

    const sort = sortOptions[req.query.sort] || sortOptions.newest;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select("-costPrice")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: products.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      products,
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch products",
    });
  }
};

// GET /api/products/:id
// Accepts either a MongoDB ID or a product slug
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    let product = null;

    if (mongoose.isValidObjectId(id)) {
      product = await Product.findOne({
        _id: id,
        isActive: true,
      })
        .select("-costPrice")
        .lean();
    }

    if (!product) {
      product = await Product.findOne({
        slug: id.toLowerCase(),
        isActive: true,
      })
        .select("-costPrice")
        .lean();
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get product details error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch product details",
    });
  }
};

// GET /api/products/categories
export const getProductCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category", {
      isActive: true,
    });

    return res.status(200).json({
      success: true,
      categories: categories.sort((a, b) => a.localeCompare(b)),
    });
  } catch (error) {
    console.error("Get categories error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch categories",
    });
  }
};

// GET /api/products/brands
export const getProductBrands = async (req, res) => {
  try {
    const brands = await Product.distinct("brand", {
      isActive: true,
      brand: { $nin: ["", null] },
    });

    return res.status(200).json({
      success: true,
      brands: brands
        .filter((brand) => typeof brand === "string" && brand.trim())
        .sort((a, b) => a.localeCompare(b)),
    });
  } catch (error) {
    console.error("Get brands error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch brands",
    });
  }
};
