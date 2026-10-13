
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  LoaderCircle,
  Package,
  ShieldCheck,
  Truck,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import ReviewSection from "../pages/ReviewSection";

import api from "../services/api";
import { useCart } from "../context/CartContext";

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function getImages(product) {
  const images = Array.isArray(product?.images)
    ? product.images
    : [];

  const normalizedImages = images
    .map((image) => {
      if (typeof image === "string") {
        return {
          url: image,
          alt: product?.name || "Product image",
        };
      }

      if (image && typeof image === "object" && image.url) {
        return {
          url: image.url,
          alt: image.alt || product?.name || "Product image",
        };
      }

      return null;
    })
    .filter(Boolean);

  if (normalizedImages.length === 0) {
    const fallback = product?.image || product?.imageUrl || "";

    if (fallback) {
      return [
        {
          url: fallback,
          alt: product?.name || "Product image",
        },
      ];
    }
  }

  return normalizedImages;
}

function getWarranty(warranty) {
  if (!warranty) return "";

  if (typeof warranty === "string" || typeof warranty === "number") {
    return String(warranty);
  }

  if (typeof warranty === "object") {
    const duration = warranty.duration;
    const unit = warranty.unit || "months";

    if (duration !== undefined && duration !== null && duration !== "") {
      return `${duration} ${unit}`;
    }

    return warranty.description || "";
  }

  return "";
}

function getSpecifications(specifications) {
  if (Array.isArray(specifications)) {
    return specifications
      .map((item, index) => {
        if (item && typeof item === "object") {
          return {
            key:
              item.name ||
              item.key ||
              item.label ||
              `Specification ${index + 1}`,
            value:
              item.value ??
              item.valueText ??
              item.description ??
              "",
          };
        }

        return {
          key: `Specification ${index + 1}`,
          value: item,
        };
      })
      .filter(
        (item) =>
          item.value !== "" &&
          item.value !== null &&
          item.value !== undefined
      );
  }

  if (specifications && typeof specifications === "object") {
    return Object.entries(specifications).map(([key, value]) => ({
      key,
      value:
        value && typeof value === "object"
          ? JSON.stringify(value)
          : value,
    }));
  }

  return [];
}

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedImage, setSelectedImage] = useState(0);
  const [failedImages, setFailedImages] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      setLoading(true);
      setError("");
      setProduct(null);
      setQuantity(1);
      setSelectedImage(0);
      setFailedImages([]);

      try {
        const response = await api.get(
          `/products/${encodeURIComponent(id)}`
        );

        const fetchedProduct = response.data?.product;

        if (!response.data?.success || !fetchedProduct) {
          throw new Error("Product nahi mila.");
        }

        if (active) {
          setProduct(fetchedProduct);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Product load nahi ho paaya."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadProduct();
    } else {
      setError("Product ID nahi mili.");
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-96 items-center justify-center gap-3 bg-slate-50 px-4">
        <LoaderCircle
          className="animate-spin text-amber-600"
          size={30}
        />
        <span className="font-medium text-slate-600">
          Product load ho raha hai...
        </span>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <AlertCircle className="mx-auto text-red-500" size={48} />

        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          Product load nahi ho paaya
        </h1>

        <p className="mt-2 break-words text-slate-500">
          {error || "Product unavailable hai."}
        </p>

        <Link
          to="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-semibold text-white transition hover:bg-amber-600"
        >
          <ArrowLeft size={18} />
          Back to Shop
        </Link>
      </main>
    );
  }

  const images = getImages(product);
  const currentImage = images[selectedImage];
  const currentImageFailed =
    !currentImage || failedImages.includes(selectedImage);

  const price = Number(product.price) || 0;
  const compareAtPrice = Number(product.compareAtPrice) || 0;

  const tracked = product.trackInventory !== false;
  const stock = Math.max(0, Number(product.stock) || 0);
  const allowBackorder = product.allowBackorder === true;

  const unavailable =
    tracked && stock <= 0 && !allowBackorder;

  const maxQuantity =
    tracked && !allowBackorder ? stock : 99;

  const warranty = getWarranty(product.warranty);
  const specifications = getSpecifications(product.specifications);

  const discount =
    compareAtPrice > price && compareAtPrice > 0
      ? Math.round(
          ((compareAtPrice - price) / compareAtPrice) * 100
        )
      : 0;

  const selectImage = (index) => {
    setSelectedImage(index);
  };

  const showPreviousImage = () => {
    setSelectedImage((current) =>
      current === 0 ? images.length - 1 : current - 1
    );
  };

  const showNextImage = () => {
    setSelectedImage((current) =>
      current === images.length - 1 ? 0 : current + 1
    );
  };

  const addProduct = () => {
    if (unavailable) {
      toast.error("Ye product abhi stock mein nahi hai.");
      return;
    }

    if (tracked && !allowBackorder && quantity > stock) {
      toast.error(`Sirf ${stock} items available hain.`);
      return;
    }

    try {
      addToCart(product, quantity);
      toast.success("Product cart mein add ho gaya!");
    } catch {
      toast.error("Product cart mein add nahi ho paaya.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/shop"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-amber-700 transition hover:text-amber-800"
        >
          <ArrowLeft size={17} />
          Back to Shop
        </Link>

        <div className="grid gap-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-2 lg:gap-12 lg:p-10">
          {/* Product image gallery */}
          <div className="min-w-0">
            <div className="relative flex min-h-72 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 sm:min-h-96">
              {currentImage && !currentImageFailed ? (
                <>
                  <img
                    key={currentImage.url}
                    src={currentImage.url}
                    alt={currentImage.alt || product.name}
                    onError={() =>
                      setFailedImages((previous) =>
                        previous.includes(selectedImage)
                          ? previous
                          : [...previous, selectedImage]
                      )
                    }
                    className="max-h-[480px] w-full object-contain p-5"
                  />

                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={showPreviousImage}
                        aria-label="Previous product image"
                        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-800 shadow-sm transition hover:bg-amber-50"
                      >
                        <ChevronLeft size={22} />
                      </button>

                      <button
                        type="button"
                        onClick={showNextImage}
                        aria-label="Next product image"
                        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-800 shadow-sm transition hover:bg-amber-50"
                      >
                        <ChevronRight size={22} />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="p-10 text-center text-slate-400">
                  <Package size={56} className="mx-auto" />
                  <p className="mt-3">Image unavailable</p>
                </div>
              )}

              {images.length > 0 && (
                <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                  {selectedImage + 1} / {images.length}
                </span>
              )}
            </div>

            {/* Clickable thumbnails */}
            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
                {images.map((image, index) => (
                  <button
                    key={`${image.url}-${index}`}
                    type="button"
                    onClick={() => selectImage(index)}
                    aria-label={`View product image ${index + 1}`}
                    aria-pressed={selectedImage === index}
                    className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border-2 bg-white p-1 transition ${
                      selectedImage === index
                        ? "border-amber-500 ring-2 ring-amber-100"
                        : "border-slate-200 hover:border-amber-300"
                    }`}
                  >
                    {!failedImages.includes(index) ? (
                      <img
                        src={image.url}
                        alt={image.alt || `${product.name} ${index + 1}`}
                        onError={() =>
                          setFailedImages((previous) =>
                            previous.includes(index)
                              ? previous
                              : [...previous, index]
                          )
                        }
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Package size={24} className="text-slate-300" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {images.length > 1 && (
              <p className="mt-2 text-center text-xs text-slate-500">
                Product ki alag-alag photos dekhne ke liye thumbnail par click karein.
              </p>
            )}
          </div>

          {/* Product information */}
          <div className="flex min-w-0 flex-col">
            <p className="text-sm font-bold uppercase tracking-wide text-amber-700">
              {product.category || "Electrical Products"}
            </p>

            <h1 className="mt-3 break-words text-2xl font-extrabold text-slate-900 sm:text-3xl">
              {product.name}
            </h1>

            {product.brand && (
              <p className="mt-2 text-sm text-slate-500">
                Brand: {product.brand}
              </p>
            )}

            {product.model && (
              <p className="mt-1 text-sm text-slate-500">
                Model: {product.model}
              </p>
            )}

            {/* Price */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="text-3xl font-black text-slate-900">
                {formatPrice(price)}
              </span>

              {compareAtPrice > price && (
                <>
                  <span className="text-base text-slate-400 line-through">
                    {formatPrice(compareAtPrice)}
                  </span>

                  {discount > 0 && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
                      {discount}% OFF
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Stock and SKU */}
            <div className="mt-5 border-y border-slate-100 py-4">
              <p
                className={`text-sm font-semibold ${
                  unavailable ? "text-red-600" : "text-green-700"
                }`}
              >
                {unavailable
                  ? "Out of stock"
                  : !tracked
                    ? "Availability confirmed by store"
                    : allowBackorder && stock <= 0
                      ? "Available on backorder"
                      : `${stock} items available`}
              </p>

              {product.sku && (
                <p className="mt-2 text-sm text-slate-500">
                  SKU: {product.sku}
                </p>
              )}
            </div>

            {/* Description */}
            <p className="mt-5 whitespace-pre-line break-words text-sm leading-7 text-slate-600">
              {product.description ||
                product.shortDescription ||
                "Is product ki additional description abhi available nahi hai."}
            </p>

            {/* Warranty */}
            {warranty && (
              <p className="mt-4 text-sm text-slate-600">
                <strong>Warranty:</strong> {warranty}
              </p>
            )}

            {/* Specifications */}
            {specifications.length > 0 && (
              <div className="mt-6">
                <h2 className="font-bold text-slate-900">
                  Specifications
                </h2>

                <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {specifications.map((item, index) => (
                    <div
                      key={`${item.key}-${index}`}
                      className="flex justify-between gap-4 px-4 py-3 text-sm"
                    >
                      <span className="capitalize text-slate-500">
                        {item.key}
                      </span>

                      <span className="max-w-[60%] break-words text-right font-medium text-slate-800">
                        {String(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-xl border border-slate-200">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                  onClick={() =>
                    setQuantity((current) =>
                      Math.max(1, current - 1)
                    )
                  }
                  className="p-3 transition hover:bg-slate-100 disabled:opacity-40"
                >
                  <Minus size={16} />
                </button>

                <span className="min-w-10 text-center font-bold">
                  {quantity}
                </span>

                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={unavailable || quantity >= maxQuantity}
                  onClick={() =>
                    setQuantity((current) =>
                      Math.min(maxQuantity, current + 1)
                    )
                  }
                  className="p-3 transition hover:bg-slate-100 disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                type="button"
                disabled={unavailable}
                onClick={addProduct}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3.5 font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                <ShoppingCart size={19} />
                {unavailable ? "Out of Stock" : "Add to Cart"}
              </button>
            </div>

            {/* Store benefits */}
            <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <ShieldCheck
                  className="shrink-0 text-green-600"
                  size={22}
                />
                Quality products
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Truck
                  className="shrink-0 text-amber-600"
                  size={22}
                />
                Delivery details at checkout
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews & Ratings */}
        <ReviewSection
          productId={product._id || product.id || id}
        />
      </div>
    </main>
  );
}
