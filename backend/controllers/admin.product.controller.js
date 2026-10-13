
import Product from "../models/Product.js";

// CREATE PRODUCT
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      sku,
      description,
      shortDescription,
      category,
      subcategory,
      brand,
      model,
      price,
      compareAtPrice,
      stock,
      images,
      specifications,
      warranty,
      isFeatured,
      isBestSeller,
      tags,
    } = req.body;

    // Required fields validation
    if (
      !name?.trim() ||
      !sku?.trim() ||
      !category?.trim() ||
      price === undefined ||
      price === null ||
      price === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, SKU, category and price are required.",
      });
    }

    const numericPrice = Number(price);
    const numericStock = stock === undefined ? 0 : Number(stock);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0 ||
      !Number.isInteger(numericStock) ||
      numericStock < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid price and non-negative whole-number stock.",
      });
    }

    // Validate compare-at price
    if (
      compareAtPrice !== undefined &&
      compareAtPrice !== null &&
      compareAtPrice !== "" &&
      (!Number.isFinite(Number(compareAtPrice)) ||
        Number(compareAtPrice) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Original price must be a valid non-negative number.",
      });
    }

    if (
      compareAtPrice !== undefined &&
      compareAtPrice !== null &&
      compareAtPrice !== "" &&
      Number(compareAtPrice) <= numericPrice
    ) {
      return res.status(400).json({
        success: false,
        message: "Original price must be greater than selling price.",
      });
    }

    const normalizedSku = sku.trim().toUpperCase();

    // Generate a slug when one is not supplied
    const normalizedSlug =
      slug?.trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") ||
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    // Check duplicate SKU or slug
    const existingProduct = await Product.findOne({
      $or: [
        { sku: normalizedSku },
        { slug: normalizedSlug },
      ],
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: "A product with this SKU or slug already exists.",
      });
    }

    // Images must be objects containing a URL
    const normalizedImages = Array.isArray(images)
      ? images
          .filter(
            (image) =>
              image &&
              typeof image.url === "string" &&
              image.url.trim()
          )
          .map((image) => ({
            url: image.url.trim(),
            publicId:
              typeof image.publicId === "string"
                ? image.publicId
                : "",
            alt:
              typeof image.alt === "string"
                ? image.alt
                : name.trim(),
          }))
      : [];

    // Specifications are stored as an array of name/value objects
    const normalizedSpecifications = Array.isArray(specifications)
      ? specifications
          .filter(
            (item) =>
              item &&
              typeof item.name === "string" &&
              typeof item.value === "string" &&
              item.name.trim() &&
              item.value.trim()
          )
          .map((item) => ({
            name: item.name.trim(),
            value: item.value.trim(),
          }))
      : [];

    // Normalize warranty object
    const normalizedWarranty =
      warranty && typeof warranty === "object" && !Array.isArray(warranty)
        ? {
            duration: Math.max(0, Number(warranty.duration) || 0),
            unit: ["days", "months", "years"].includes(warranty.unit)
              ? warranty.unit
              : "years",
            description:
              typeof warranty.description === "string"
                ? warranty.description.trim()
                : "",
          }
        : {
            duration: 0,
            unit: "years",
            description: "",
          };

    const productData = {
      name: name.trim(),
      slug: normalizedSlug,
      sku: normalizedSku,
      description: description || "",
      shortDescription: shortDescription || "",
      category: category.trim(),
      subcategory: subcategory || "",
      brand: brand || "",
      model: model || "",
      price: numericPrice,
      stock: numericStock,
      images: normalizedImages,
      specifications: normalizedSpecifications,
      warranty: normalizedWarranty,
      isFeatured: Boolean(isFeatured),
      isBestSeller: Boolean(isBestSeller),
      tags: Array.isArray(tags) ? tags : [],
      createdBy: req.user.id,
    };

    if (
      compareAtPrice !== undefined &&
      compareAtPrice !== null &&
      compareAtPrice !== ""
    ) {
      productData.compareAtPrice = Number(compareAtPrice);
    }

    const product = await Product.create(productData);

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];

      return res.status(409).json({
        success: false,
        message: `A product with this ${duplicateField || "SKU or slug"} already exists.`,
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to create product.",
    });
  }
};

// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Protected fields cannot be updated from the request
    const restrictedFields = [
      "_id",
      "__v",
      "createdBy",
      "createdAt",
      "updatedAt",
      "ratings",
      "costPrice",
      "isActive",
    ];

    restrictedFields.forEach((field) => delete updates[field]);

    if (updates.name !== undefined) {
      if (typeof updates.name !== "string" || !updates.name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Product name cannot be empty.",
        });
      }

      updates.name = updates.name.trim();
    }

    if (updates.sku !== undefined) {
      if (typeof updates.sku !== "string" || !updates.sku.trim()) {
        return res.status(400).json({
          success: false,
          message: "SKU cannot be empty.",
        });
      }

      updates.sku = updates.sku.trim().toUpperCase();
    }

    if (updates.slug !== undefined) {
      if (typeof updates.slug !== "string" || !updates.slug.trim()) {
        return res.status(400).json({
          success: false,
          message: "Slug cannot be empty.",
        });
      }

      updates.slug = updates.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }

    if (updates.price !== undefined) {
      updates.price = Number(updates.price);

      if (!Number.isFinite(updates.price) || updates.price < 0) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid price.",
        });
      }
    }

    if (updates.stock !== undefined) {
      updates.stock = Number(updates.stock);

      if (!Number.isInteger(updates.stock) || updates.stock < 0) {
        return res.status(400).json({
          success: false,
          message: "Stock must be a non-negative whole number.",
        });
      }
    }

    if (updates.compareAtPrice !== undefined) {
      if (
        updates.compareAtPrice === null ||
        updates.compareAtPrice === ""
      ) {
        updates.compareAtPrice = null;
      } else {
        updates.compareAtPrice = Number(updates.compareAtPrice);

        if (
          !Number.isFinite(updates.compareAtPrice) ||
          updates.compareAtPrice < 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Original price must be a valid non-negative number.",
          });
        }

        const sellingPrice =
          updates.price !== undefined
            ? updates.price
            : product.price;

        if (updates.compareAtPrice <= sellingPrice) {
          return res.status(400).json({
            success: false,
            message: "Original price must be greater than selling price.",
          });
        }
      }
    }

    if (updates.images !== undefined) {
      if (!Array.isArray(updates.images)) {
        return res.status(400).json({
          success: false,
          message: "Images must be provided as an array.",
        });
      }

      updates.images = updates.images
        .filter(
          (image) =>
            image &&
            typeof image.url === "string" &&
            image.url.trim()
        )
        .map((image) => ({
          url: image.url.trim(),
          publicId:
            typeof image.publicId === "string"
              ? image.publicId
              : "",
          alt: typeof image.alt === "string" ? image.alt : "",
        }));
    }

    if (updates.specifications !== undefined) {
      if (!Array.isArray(updates.specifications)) {
        return res.status(400).json({
          success: false,
          message: "Specifications must be an array.",
        });
      }

      updates.specifications = updates.specifications
        .filter(
          (item) =>
            item &&
            typeof item.name === "string" &&
            typeof item.value === "string" &&
            item.name.trim() &&
            item.value.trim()
        )
        .map((item) => ({
          name: item.name.trim(),
          value: item.value.trim(),
        }));
    }

    if (updates.warranty !== undefined) {
      if (
        !updates.warranty ||
        typeof updates.warranty !== "object" ||
        Array.isArray(updates.warranty)
      ) {
        return res.status(400).json({
          success: false,
          message: "Warranty must be an object.",
        });
      }

      updates.warranty = {
        duration: Math.max(
          0,
          Number(updates.warranty.duration) || 0
        ),
        unit: ["days", "months", "years"].includes(
          updates.warranty.unit
        )
          ? updates.warranty.unit
          : "years",
        description:
          typeof updates.warranty.description === "string"
            ? updates.warranty.description.trim()
            : "",
      };
    }

    if (updates.tags !== undefined && !Array.isArray(updates.tags)) {
      return res.status(400).json({
        success: false,
        message: "Tags must be provided as an array.",
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update product error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "SKU or slug already exists.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to update product.",
    });
  }
};

// DELETE PRODUCT
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    await product.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to delete product.",
    });
  }
};
