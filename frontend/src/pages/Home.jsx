
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Lightbulb,
  Fan,
  Cable,
  ToggleLeft,
  Snowflake,
  Plug,
  ShieldCheck,
  Truck,
  Headphones,
  ShoppingCart,
  LoaderCircle,
  Zap,
  Heart,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import api from "../services/api";

const categories = [
  {
    name: "LED Lights",
    icon: Lightbulb,
    color: "bg-amber-50 text-amber-600",
  },
  {
    name: "Fans",
    icon: Fan,
    color: "bg-sky-50 text-sky-600",
  },
  {
    name: "Wires & Cables",
    icon: Cable,
    color: "bg-rose-50 text-rose-600",
  },
  {
    name: "Switches",
    icon: ToggleLeft,
    color: "bg-violet-50 text-violet-600",
  },
  {
    name: "Coolers",
    icon: Snowflake,
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    name: "Electrical Appliances",
    icon: Plug,
    color: "bg-orange-50 text-orange-600",
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "Quality Products",
    description:
      "Explore electrical products for everyday needs at home and work.",
  },
  {
    icon: Truck,
    title: "Convenient Shopping",
    description:
      "Browse products online and find the right electrical essentials.",
  },
  {
    icon: Headphones,
    title: "Customer Support",
    description:
      "Get help with product enquiries and choosing suitable items.",
  },
];

function formatPrice(value) {
  const price = Number(value);

  return Number.isFinite(price)
    ? `₹${price.toLocaleString("en-IN")}`
    : "Price unavailable";
}

function getProductImage(product) {
  const firstImage = product?.images?.[0];

  if (typeof firstImage === "string") {
    return firstImage;
  }

  return firstImage?.url || product?.image || product?.imageUrl || "";
}

function getWishlistProducts(data) {
  const result = data?.data ?? data;

  if (Array.isArray(result?.wishlist?.products)) {
    return result.wishlist.products;
  }

  if (Array.isArray(result?.wishlist)) {
    return result.wishlist;
  }

  if (Array.isArray(result?.products)) {
    return result.products;
  }

  return [];
}

// Product ki average rating aur total reviews load karein
function ProductRating({ productId }) {
  const [ratingData, setRatingData] = useState({
    averageRating: 0,
    totalReviews: 0,
  });

  useEffect(() => {
    let active = true;

    const fetchRating = async () => {
      try {
        const response = await api.get(
          `/reviews/${encodeURIComponent(productId)}`
        );

        if (active && response.data?.success) {
          setRatingData({
            averageRating: Number(response.data.averageRating || 0),
            totalReviews: Number(response.data.totalReviews || 0),
          });
        }
      } catch (error) {
        console.error("Product rating load error:", error);
      }
    };

    if (productId) {
      fetchRating();
    }

    return () => {
      active = false;
    };
  }, [productId]);

  const { averageRating, totalReviews } = ratingData;

  return (
    <div
      className="mt-2 flex min-h-6 flex-wrap items-center gap-1.5 text-xs"
      aria-label={
        totalReviews > 0
          ? `${averageRating} out of 5 stars, ${totalReviews} reviews`
          : "No reviews yet"
      }
    >
      {totalReviews > 0 ? (
        <>
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 font-bold text-emerald-700">
            {averageRating.toFixed(1)}
            <Star
              size={13}
              fill="currentColor"
              className="text-amber-500"
            />
          </span>

          <span className="text-slate-500">
            ({totalReviews}{" "}
            {totalReviews === 1 ? "review" : "reviews"})
          </span>
        </>
      ) : (
        <span className="text-slate-400">No reviews yet</span>
      )}
    </div>
  );
}

function ProductImage({ product }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getProductImage(product);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  if (!imageUrl || imageFailed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-50 text-slate-300">
        <Plug size={42} strokeWidth={1.4} />
        <span className="text-xs font-medium text-slate-400">
          Product Image
        </span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={product?.name || "Electrical product"}
      loading="lazy"
      onError={() => setImageFailed(true)}
      className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105"
    />
  );
}

function ProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
  wishlistLoading,
}) {
  const price = Number(product?.price ?? 0);
  const compareAtPrice = Number(product?.compareAtPrice ?? 0);

  const hasDiscount =
    Number.isFinite(price) &&
    Number.isFinite(compareAtPrice) &&
    compareAtPrice > price &&
    compareAtPrice > 0;

  const discount = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  const isOutOfStock =
    product?.trackInventory !== false &&
    Number(product?.stock ?? 0) <= 0 &&
    product?.allowBackorder !== true;

  const productPath = product?.slug
    ? `/product/${encodeURIComponent(product.slug)}`
    : `/product/${product?._id}`;

  const handleHeartClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onToggleWishlist(product);
  };

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl">
      {/* Product image and badges */}
      <div className="relative h-40 overflow-hidden sm:h-52">
        <Link
          to={productPath}
          aria-label={`View ${product?.name || "product"}`}
          className="block h-full w-full"
        >
          <ProductImage product={product} />
        </Link>

        {/* Wishlist button */}
        <button
          type="button"
          onClick={handleHeartClick}
          disabled={wishlistLoading}
          aria-label={
            isWishlisted ? "Remove from wishlist" : "Add to wishlist"
          }
          aria-pressed={isWishlisted}
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          className={`absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border shadow-md transition hover:scale-110 disabled:cursor-wait disabled:opacity-60 ${
            isWishlisted
              ? "border-rose-200 bg-rose-50 text-rose-600"
              : "border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          }`}
        >
          <Heart
            size={20}
            fill={isWishlisted ? "currentColor" : "none"}
          />
        </button>

        {product?.isFeatured && (
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold text-white">
            Featured
          </span>
        )}

        {product?.isBestSeller && (
          <span className="pointer-events-none absolute left-3 top-10 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-bold text-white sm:top-11">
            Best Seller
          </span>
        )}

        {isOutOfStock && (
          <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold text-white">
            Out of Stock
          </span>
        )}
      </div>

      {/* Product information */}
      <div className="p-3 sm:p-4">
        <p className="truncate text-xs font-semibold text-orange-600">
          {product?.category || "Electrical Products"}
        </p>

        <Link to={productPath} className="block">
          <h3 className="mt-2 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-800 transition group-hover:text-orange-600">
            {product?.name || "Electrical Product"}
          </h3>
        </Link>

        {/* Average rating and review count */}
        <ProductRating productId={product?._id} />

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-lg font-black text-slate-950">
            {formatPrice(price)}
          </span>

          {hasDiscount && (
            <>
              <span className="text-xs text-slate-400 line-through">
                {formatPrice(compareAtPrice)}
              </span>

              <span className="text-xs font-bold text-green-600">
                {discount}% OFF
              </span>
            </>
          )}
        </div>

        <Link
          to={productPath}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-orange-600 sm:text-sm"
        >
          View Product
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistLoadingIds, setWishlistLoadingIds] = useState([]);

  // Home page products load karein
  useEffect(() => {
    let active = true;

    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        setProductError("");

        const response = await api.get("/products", {
          params: {
            limit: 8,
            page: 1,
            sort: "newest",
          },
        });

        if (!response.data?.success) {
          throw new Error(
            response.data?.message || "Products load nahi ho paaye."
          );
        }

        if (active) {
          setProducts(
            Array.isArray(response.data?.products)
              ? response.data.products
              : []
          );
        }
      } catch (error) {
        console.error("Failed to load home products:", error);

        if (active) {
          setProductError(
            error.response?.data?.message ||
              error.message ||
              "Products abhi load nahi ho paaye."
          );
        }
      } finally {
        if (active) {
          setLoadingProducts(false);
        }
      }
    };

    fetchProducts();

    return () => {
      active = false;
    };
  }, [retryCount]);

  // Saved wishlist products load karein
  useEffect(() => {
    let active = true;

    const fetchWishlist = async () => {
      try {
        const response = await api.get("/wishlist");

        if (!active) return;

        const savedProducts = getWishlistProducts(response.data);

        setWishlistIds(
          savedProducts
            .map((item) =>
              typeof item === "string" ? item : item?._id
            )
            .filter(Boolean)
            .map(String)
        );
      } catch {
        if (active) {
          setWishlistIds([]);
        }
      }
    };

    fetchWishlist();

    return () => {
      active = false;
    };
  }, []);

  // Wishlist mein product add/remove karein
  const handleToggleWishlist = async (product) => {
    const productId = product?._id;

    if (!productId) {
      toast.error("Product ID nahi mili.");
      return;
    }

    const id = String(productId);

    if (wishlistLoadingIds.includes(id)) {
      return;
    }

    const alreadySaved = wishlistIds.includes(id);

    setWishlistLoadingIds((previous) => [...previous, id]);

    try {
      if (alreadySaved) {
        await api.delete(`/wishlist/${id}`);

        setWishlistIds((previous) =>
          previous.filter((savedId) => savedId !== id)
        );

        toast.success("Product wishlist se remove ho gaya.");
      } else {
        await api.post(`/wishlist/${id}`);

        setWishlistIds((previous) =>
          previous.includes(id) ? previous : [...previous, id]
        );

        toast.success("Product wishlist mein add ho gaya.");
      }
    } catch (error) {
      const status = error?.response?.status;

      if (status === 401 || status === 403) {
        toast.error("Wishlist use karne ke liye pehle login karein.");
      } else {
        toast.error(
          error?.response?.data?.message ||
            "Wishlist update nahi ho paayi. Dobara try karein."
        );
      }
    } finally {
      setWishlistLoadingIds((previous) =>
        previous.filter((savedId) => savedId !== id)
      );
    }
  };

  return (
    <main>
      {/* Hero Banner */}
      <section className="overflow-hidden bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:py-20 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-400/10 px-4 py-2 text-sm font-semibold text-orange-300">
              <Zap size={16} />
              Welcome to Vishal Electricals
            </span>

            <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Powering Every Home with{" "}
              <span className="text-orange-400">Quality</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Discover lighting, fans, wires, switches and electrical
              appliances for your home and business—all in one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 font-bold text-white transition hover:bg-orange-600"
              >
                Shop Products
                <ArrowRight size={18} />
              </Link>

              <a
                href="#categories"
                className="rounded-xl border border-white/20 px-6 py-3.5 font-bold transition hover:bg-white/10"
              >
                Explore Categories
              </a>
            </div>

            <div className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-6">
              {[
                ["Quality", "Products"],
                ["Helpful", "Service"],
                ["Easy", "Shopping"],
              ].map(([title, subtitle]) => (
                <div key={title}>
                  <p className="font-bold text-orange-400">{title}</p>
                  <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative px-1 pb-5 sm:px-3">
            <div className="absolute -inset-3 rounded-3xl bg-orange-500/10 blur-2xl" />

            <img
              src="https://images.unsplash.com/photo-1558008258-3256797b43f3?auto=format&fit=crop&w=1100&q=85"
              alt="Modern lighting in a home"
              className="relative h-72 w-full rounded-3xl object-cover shadow-2xl sm:h-96 lg:h-[460px]"
            />

            <div className="absolute -bottom-1 left-5 rounded-2xl bg-white p-4 text-slate-900 shadow-xl sm:left-8">
              <p className="font-bold">Brighten Your Space</p>
              <p className="mt-1 text-xs text-slate-500">
                Electrical essentials for every home
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section
        id="categories"
        className="mx-auto max-w-7xl px-4 py-14 sm:py-16 lg:px-8"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
              Explore our store
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-900">
              Shop by Category
            </h2>

            <p className="mt-3 text-slate-500">
              Find the right products for your everyday needs.
            </p>
          </div>

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 font-bold text-orange-600 hover:text-orange-700"
          >
            View All
            <ArrowRight size={17} />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <Link
                key={category.name}
                to={`/shop?category=${encodeURIComponent(category.name)}`}
                className="group rounded-2xl border border-slate-200 bg-white p-4 text-center transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg sm:p-5"
              >
                <div
                  className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl sm:h-16 sm:w-16 ${category.color} transition group-hover:scale-105`}
                >
                  <Icon size={29} strokeWidth={1.7} />
                </div>

                <h3 className="mt-4 text-sm font-bold text-slate-800">
                  {category.name}
                </h3>

                <p className="mt-2 text-xs text-slate-500">
                  Explore <span aria-hidden="true">→</span>
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Latest Products */}
      <section className="bg-slate-50 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
                Our collection
              </p>

              <h2 className="mt-2 text-3xl font-black text-slate-900">
                Latest Products
              </h2>

              <p className="mt-3 text-slate-500">
                Electrical essentials for your home and business.
              </p>
            </div>

            <Link
              to="/shop"
              className="inline-flex items-center gap-2 font-bold text-orange-600 hover:text-orange-700"
            >
              View All
              <ArrowRight size={17} />
            </Link>
          </div>

          {loadingProducts ? (
            <div className="flex min-h-48 items-center justify-center gap-3 text-slate-500">
              <LoaderCircle
                size={25}
                className="animate-spin text-orange-500"
              />
              Loading products...
            </div>
          ) : productError ? (
            <div className="mt-8 rounded-2xl border border-rose-200 bg-white p-8 text-center">
              <p className="font-bold text-rose-700">{productError}</p>

              <p className="mt-2 text-sm text-slate-500">
                Backend aur API connection check karein.
              </p>

              <button
                type="button"
                onClick={() => setRetryCount((count) => count + 1)}
                className="mt-4 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
              >
                Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <ShoppingCart size={27} />
              </div>

              <p className="mt-4 font-bold text-slate-800">
                Products coming soon
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Active products add karne par woh yahan automatically
                dikhne lagenge.
              </p>

              <Link
                to="/shop"
                className="mt-5 inline-flex items-center gap-2 font-bold text-orange-600"
              >
                Browse Shop
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => {
                const id = String(product._id);

                return (
                  <ProductCard
                    key={product._id}
                    product={product}
                    isWishlisted={wishlistIds.includes(id)}
                    onToggleWishlist={handleToggleWishlist}
                    wishlistLoading={wishlistLoadingIds.includes(id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
              Why shop with us?
            </p>

            <h2 className="mt-3 text-3xl font-black text-slate-900">
              A Better Shopping Experience
            </h2>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-orange-200 hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <Icon size={25} />
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-900">
                    {benefit.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:py-16 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-orange-500 p-8 text-white sm:p-12 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-2xl font-black sm:text-3xl">
              Looking for electrical products?
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-orange-50 sm:text-base">
              Explore our collection and find products for your home, shop
              or business.
            </p>
          </div>

          <Link
            to="/shop"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue px-6 py-3.5 font-bold text-orange-600 transition hover:bg-orange-50"
          >
            Browse Products
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
