
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  ShoppingBag,
  LoaderCircle,
  RotateCcw,
  ChevronRight,
  PackageSearch,
  Check,
  Heart,
  Zap,
  ArrowUpDown,
  Tag,
  X,
  Star,
  Filter,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import api from "../services/api";

/* -------------------- Helpers -------------------- */

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);

const getProductImage = (product) => {
  const image = product?.images?.[0];

  if (typeof image === "string") return image;
  if (image?.url) return image.url;
  if (image?.secure_url) return image.secure_url;

  return product?.image || product?.imageUrl || product?.thumbnail || "";
};

const getDiscount = (product) => {
  const price = Number(product?.sellingPrice ?? product?.price ?? 0);
  const original = Number(product?.originalPrice ?? product?.mrp ?? 0);

  return original > price && original > 0
    ? Math.round(((original - price) / original) * 100)
    : 0;
};

const getProductId = (product) => product?._id || product?.id;

const getProductName = (product) =>
  product?.name || product?.productName || "Electrical Product";

const getProductPrice = (product) =>
  Number(product?.sellingPrice ?? product?.price ?? 0);

const getOriginalPrice = (product) =>
  Number(product?.originalPrice ?? product?.mrp ?? 0);

const getProductStock = (product) =>
  Number(product?.stock ?? product?.quantity ?? 0);

const getProductLink = (product) =>
  `/product/${product?.slug || getProductId(product)}`;

const getCategoryName = (product) =>
  typeof product?.category === "object"
    ? product.category?.name || product.category?.category || ""
    : product?.category || "";

const getBrandName = (product) =>
  typeof product?.brand === "object"
    ? product.brand?.name || ""
    : product?.brand || "";

const getListFromResponse = (response, keys = []) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data?.[key])) return data.data[key];
  }

  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const readFiltersFromSearch = (searchString) => {
  const params = new URLSearchParams(searchString);

  return {
    search: params.get("search") || "",
    category: params.get("category") || "",
    brand: params.get("brand") || "",
    minPrice: params.get("minPrice") || "",
    maxPrice: params.get("maxPrice") || "",
    inStockOnly: params.get("inStock") === "true",
    sort: params.get("sort") || "newest",
  };
};

const buildSearchFromFilters = (filters) => {
  const params = new URLSearchParams();

  if (filters.search.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.category) params.set("category", filters.category);
  if (filters.brand) params.set("brand", filters.brand);
  if (filters.minPrice !== "") params.set("minPrice", filters.minPrice);
  if (filters.maxPrice !== "") params.set("maxPrice", filters.maxPrice);
  if (filters.inStockOnly) params.set("inStock", "true");
  if (filters.sort !== "newest") params.set("sort", filters.sort);

  return params.toString();
};

/* -------------------- Product Image -------------------- */

function ProductImage({ product }) {
  const [imageError, setImageError] = useState(false);
  const image = getProductImage(product);

  useEffect(() => {
    setImageError(false);
  }, [image]);

  if (!image || imageError) {
    return (
      <div className="flex h-full min-h-32 w-full items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <PackageSearch size={34} strokeWidth={1.4} />
          <span className="text-xs">Image unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={getProductName(product)}
      loading="lazy"
      onError={() => setImageError(true)}
      className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105 sm:p-5"
    />
  );
}

/* -------------------- Wishlist Button -------------------- */

function WishlistButton({ active, loading, onClick }) {
  return (
    <button
      type="button"
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      title={active ? "Remove from wishlist" : "Add to wishlist"}
      disabled={loading}
      onClick={onClick}
      className={`absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition sm:right-3 sm:top-3 sm:h-10 sm:w-10 ${
        active
          ? "border-rose-200 bg-rose-50 text-rose-600"
          : "border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-600"
      } ${loading ? "cursor-wait opacity-60" : ""}`}
    >
      {loading ? (
        <LoaderCircle size={17} className="animate-spin" />
      ) : (
        <Heart size={18} className={active ? "fill-current" : ""} />
      )}
    </button>
  );
}

/* -------------------- Filter Controls -------------------- */

function FilterControls({
  categories,
  brands,
  category,
  brand,
  minPrice,
  maxPrice,
  inStockOnly,
  setCategory,
  setBrand,
  setMinPrice,
  setMaxPrice,
  setInStockOnly,
  resetFilters,
  activeFilterCount,
}) {
  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="shop-category"
          className="mb-2 block text-sm font-bold text-slate-800"
        >
          Category
        </label>

        <select
          id="shop-category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        >
          <option value="">All Categories</option>

          {categories.map((item, index) => {
            const value =
              typeof item === "string"
                ? item
                : item?.name || item?.category || "";

            if (!value) return null;

            return (
              <option key={`${value}-${index}`} value={value}>
                {value}
              </option>
            );
          })}

          {/* Keep a category from the URL selectable even if the API
              categories endpoint does not include it. */}
          {category &&
            !categories.some((item) => {
              const value =
                typeof item === "string"
                  ? item
                  : item?.name || item?.category || "";

              return value === category;
            }) && <option value={category}>{category}</option>}
        </select>
      </div>

      <div>
        <label
          htmlFor="shop-brand"
          className="mb-2 block text-sm font-bold text-slate-800"
        >
          Brand
        </label>

        <select
          id="shop-brand"
          value={brand}
          onChange={(event) => setBrand(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        >
          <option value="">All Brands</option>

          {brands.map((item, index) => {
            const value =
              typeof item === "string"
                ? item
                : item?.name || item?.brand || "";

            if (!value) return null;

            return (
              <option key={`${value}-${index}`} value={value}>
                {value}
              </option>
            );
          })}

          {brand &&
            !brands.some((item) => {
              const value =
                typeof item === "string"
                  ? item
                  : item?.name || item?.brand || "";

              return value === brand;
            }) && <option value={brand}>{brand}</option>}
        </select>
      </div>

      <div>
        <p className="mb-3 text-sm font-bold text-slate-800">Price Range</p>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              htmlFor="shop-min-price"
              className="mb-1 block text-xs text-slate-500"
            >
              Min. Price
            </label>
            <input
              id="shop-min-price"
              type="number"
              min="0"
              placeholder="₹ 0"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label
              htmlFor="shop-max-price"
              className="mb-1 block text-xs text-slate-500"
            >
              Max. Price
            </label>
            <input
              id="shop-max-price"
              type="number"
              min="0"
              placeholder="₹ 5000"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50">
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={(event) => setInStockOnly(event.target.checked)}
          className="h-4 w-4 accent-orange-600"
        />
        <span className="flex-1 text-sm font-medium text-slate-700">
          In-stock products only
        </span>
        <Check size={16} className="text-emerald-600" />
      </label>

      <button
        type="button"
        onClick={resetFilters}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
      >
        <RotateCcw size={15} />
        Reset Filters
      </button>

      {activeFilterCount > 0 && (
        <p className="text-center text-xs text-slate-500">
          {activeFilterCount} active{" "}
          {activeFilterCount === 1 ? "filter" : "filters"}
        </p>
      )}
    </div>
  );
}

/* -------------------- Product Card -------------------- */

function ProductCard({
  product,
  wishlistIds,
  wishlistLoading,
  toggleWishlist,
  reviewStats,
}) {
  const id = getProductId(product);
  const price = getProductPrice(product);
  const originalPrice = getOriginalPrice(product);
  const discount = getDiscount(product);
  const inStock = getProductStock(product) > 0;
  const isWishlisted = wishlistIds.has(String(id));

  const category = getCategoryName(product) || "Electrical";
  const brand = getBrandName(product) || product?.subcategory || "";
  const stats = reviewStats[String(id)] || {};

  const rating = Number(
    stats.averageRating ??
      product?.averageRating ??
      product?.rating ??
      0
  );

  const totalReviews = Number(
    stats.totalReviews ??
      product?.totalReviews ??
      product?.reviewCount ??
      0
  );

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <Link
          to={getProductLink(product)}
          className="absolute inset-0"
          aria-label={`View ${getProductName(product)}`}
        >
          <ProductImage product={product} />
        </Link>

        <WishlistButton
          active={isWishlisted}
          loading={wishlistLoading.has(String(id))}
          onClick={() => toggleWishlist(product)}
        />

        {product?.isBestSeller && (
          <span className="absolute left-2 top-2 rounded-md bg-amber-400 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-amber-950 sm:left-3 sm:top-3 sm:text-[10px]">
            Best Seller
          </span>
        )}

        {!product?.isBestSeller && product?.isFeatured && (
          <span className="absolute left-2 top-2 rounded-md bg-orange-500 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white sm:left-3 sm:top-3 sm:text-[10px]">
            Featured
          </span>
        )}

        {discount > 0 && (
          <span className="absolute bottom-2 left-2 rounded-md bg-rose-600 px-2 py-1 text-[10px] font-bold text-white sm:bottom-3 sm:left-3 sm:text-xs">
            {discount}% OFF
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <span className="mb-2 truncate text-[10px] font-semibold uppercase tracking-wide text-orange-700 sm:text-xs">
          {category}
        </span>

        <Link
          to={getProductLink(product)}
          className="mb-2 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-900 transition hover:text-orange-600 sm:min-h-12 sm:text-base sm:leading-6"
        >
          {getProductName(product)}
        </Link>

        {brand && (
          <p className="mb-2 truncate text-xs text-slate-500">{brand}</p>
        )}

        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={13}
                className={
                  star <= Math.round(rating)
                    ? "fill-amber-400 text-amber-400"
                    : "fill-slate-100 text-slate-300"
                }
              />
            ))}
          </div>

          {totalReviews > 0 ? (
            <>
              <span className="text-xs font-bold text-slate-700">
                {rating.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-500 sm:text-xs">
                ({totalReviews}{" "}
                {totalReviews === 1 ? "review" : "reviews"})
              </span>
            </>
          ) : (
            <span className="text-[10px] text-slate-400 sm:text-xs">
              No reviews yet
            </span>
          )}
        </div>

        <div className="mb-3 mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-base font-extrabold text-slate-900 sm:text-lg">
            {formatPrice(price)}
          </span>

          {originalPrice > price && (
            <span className="text-xs text-slate-400 line-through sm:text-sm">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        <div className="mb-3 flex items-center gap-1.5">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              inStock ? "bg-emerald-500" : "bg-rose-500"
            }`}
          />
          <span
            className={`text-[10px] font-medium sm:text-xs ${
              inStock ? "text-emerald-700" : "text-rose-600"
            }`}
          >
            {inStock ? "In Stock" : "Out of Stock"}
          </span>
        </div>

        <Link
          to={getProductLink(product)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-2 py-2.5 text-xs font-bold text-white transition hover:bg-orange-600 sm:gap-2 sm:px-3 sm:py-3 sm:text-sm"
        >
          View Details
          <ChevronRight size={15} />
        </Link>
      </div>
    </article>
  );
}

/* -------------------- Main Shop Page -------------------- */

export default function Shop() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialFilters = useMemo(
    () => readFiltersFromSearch(location.search),
    // Only the initial route is used to initialize state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [search, setSearch] = useState(initialFilters.search);
  const [category, setCategory] = useState(initialFilters.category);
  const [brand, setBrand] = useState(initialFilters.brand);
  const [minPrice, setMinPrice] = useState(initialFilters.minPrice);
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice);
  const [inStockOnly, setInStockOnly] = useState(initialFilters.inStockOnly);
  const [sort, setSort] = useState(initialFilters.sort);

  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [wishlistLoading, setWishlistLoading] = useState(new Set());
  const [wishlistError, setWishlistError] = useState(false);
  const [reviewStats, setReviewStats] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Track whether the next URL change was initiated by this component.
  const lastWrittenSearchRef = useRef(null);

  const activeFilterCount = [
    category,
    brand,
    minPrice,
    maxPrice,
    inStockOnly,
  ].filter(Boolean).length;

  /* -------- Read externally changed URL filters -------- */

  useEffect(() => {
    const currentSearch = location.search.replace(/^\?/, "");

    if (lastWrittenSearchRef.current === currentSearch) {
      lastWrittenSearchRef.current = null;
      return;
    }

    const next = readFiltersFromSearch(location.search);

    setSearch((previous) =>
      previous === next.search ? previous : next.search
    );
    setCategory((previous) =>
      previous === next.category ? previous : next.category
    );
    setBrand((previous) => (previous === next.brand ? previous : next.brand));
    setMinPrice((previous) =>
      previous === next.minPrice ? previous : next.minPrice
    );
    setMaxPrice((previous) =>
      previous === next.maxPrice ? previous : next.maxPrice
    );
    setInStockOnly((previous) =>
      previous === next.inStockOnly ? previous : next.inStockOnly
    );
    setSort((previous) => (previous === next.sort ? previous : next.sort));
  }, [location.search]);

  /* -------- Sync current filters to URL -------- */

  useEffect(() => {
    const nextSearch = buildSearchFromFilters({
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      inStockOnly,
      sort,
    });

    const currentSearch = location.search.replace(/^\?/, "");

    if (currentSearch === nextSearch) return;

    lastWrittenSearchRef.current = nextSearch;
    setSearchParams(new URLSearchParams(nextSearch), { replace: true });
  }, [
    search,
    category,
    brand,
    minPrice,
    maxPrice,
    inStockOnly,
    sort,
    location.search,
    setSearchParams,
  ]);

  /* -------- Fetch products -------- */

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const params = {};

        if (search.trim()) params.search = search.trim();
        if (category) params.category = category;
        if (brand) params.brand = brand;
        if (minPrice !== "") params.minPrice = minPrice;
        if (maxPrice !== "") params.maxPrice = maxPrice;
        if (inStockOnly) params.inStock = true;

        const sortMap = {
          newest: "newest",
          "price-low": "price-low",
          "price-high": "price-high",
          name: "name",
          popular: "popular",
          discount: "newest",
        };

        params.sort = sortMap[sort] || "newest";

        const response = await api.get("/products", { params });

        if (cancelled) return;

        const list = getListFromResponse(response, [
          "products",
          "items",
          "results",
        ]);

        setProducts(list);
      } catch (err) {
        if (cancelled) return;

        setError(
          err?.response?.data?.message ||
            "Products load nahi ho paaye. Please try again."
        );
        setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, search.trim() ? 350 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    search,
    category,
    brand,
    minPrice,
    maxPrice,
    inStockOnly,
    sort,
    retryCount,
  ]);

  /* -------- Fetch categories and brands -------- */

  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      const [categoryResponse, brandResponse] = await Promise.allSettled([
        api.get("/products/categories"),
        api.get("/products/brands"),
      ]);

      if (cancelled) return;

      if (categoryResponse.status === "fulfilled") {
        setCategories(
          getListFromResponse(categoryResponse.value, ["categories", "items"])
        );
      }

      if (brandResponse.status === "fulfilled") {
        setBrands(
          getListFromResponse(brandResponse.value, ["brands", "items"])
        );
      }
    };

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  /* -------- Fetch reviews for displayed products -------- */

  useEffect(() => {
    let cancelled = false;

    const loadReviewStats = async () => {
      if (!products.length) {
        setReviewStats({});
        return;
      }

      const results = await Promise.allSettled(
        products.map(async (product) => {
          const id = getProductId(product);
          if (!id) return null;

          const response = await api.get(
            `/reviews/${encodeURIComponent(id)}`
          );

          const data = response?.data?.data ?? response?.data;

          return {
            id: String(id),
            averageRating: Number(data?.averageRating ?? 0),
            totalReviews: Number(data?.totalReviews ?? 0),
          };
        })
      );

      if (cancelled) return;

      const nextStats = {};

      results.forEach((result) => {
        if (result.status === "fulfilled" && result.value?.id) {
          nextStats[result.value.id] = {
            averageRating: result.value.averageRating,
            totalReviews: result.value.totalReviews,
          };
        }
      });

      setReviewStats((previous) => ({
        ...previous,
        ...nextStats,
      }));
    };

    loadReviewStats();

    return () => {
      cancelled = true;
    };
  }, [products]);

  /* -------- Load wishlist -------- */

  const loadWishlist = useCallback(async () => {
    try {
      const response = await api.get("/wishlist");
      const list = getListFromResponse(response, ["wishlist", "items"]);

      const ids = list
        .map((item) => {
          const product = item?.productId || item?.product || item;

          return typeof product === "string"
            ? product
            : product?._id || product?.id;
        })
        .filter(Boolean)
        .map(String);

      setWishlistIds(new Set(ids));
      setWishlistError(false);
    } catch (err) {
      if (err?.response?.status === 401) {
        setWishlistIds(new Set());
        setWishlistError(false);
      } else {
        setWishlistError(true);
      }
    }
  }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  /* -------- Toggle wishlist -------- */

  const toggleWishlist = useCallback(
    async (product) => {
      const id = getProductId(product);

      if (!id) {
        toast.error("Product ID nahi mila.");
        return;
      }

      const key = String(id);

      if (wishlistLoading.has(key)) return;

      setWishlistLoading((previous) => {
        const next = new Set(previous);
        next.add(key);
        return next;
      });

      try {
        if (wishlistIds.has(key)) {
          await api.delete(`/wishlist/${id}`);

          setWishlistIds((previous) => {
            const next = new Set(previous);
            next.delete(key);
            return next;
          });

          toast.success("Wishlist se remove ho gaya.");
        } else {
          await api.post(`/wishlist/${id}`);

          setWishlistIds((previous) => {
            const next = new Set(previous);
            next.add(key);
            return next;
          });

          toast.success("Wishlist mein add ho gaya.");
        }

        setWishlistError(false);
      } catch (err) {
        if (err?.response?.status === 401) {
          toast.error("Wishlist use karne ke liye login karein.");
        } else {
          toast.error(
            err?.response?.data?.message ||
              "Wishlist update nahi ho paayi."
          );
        }
      } finally {
        setWishlistLoading((previous) => {
          const next = new Set(previous);
          next.delete(key);
          return next;
        });
      }
    },
    [wishlistIds, wishlistLoading]
  );

  /* -------- Client-side sorting -------- */

  const displayedProducts = useMemo(() => {
    const result = [...products];

    if (sort === "discount") {
      result.sort((a, b) => getDiscount(b) - getDiscount(a));
    } else if (sort === "price-low") {
      result.sort((a, b) => getProductPrice(a) - getProductPrice(b));
    } else if (sort === "price-high") {
      result.sort((a, b) => getProductPrice(b) - getProductPrice(a));
    } else if (sort === "name") {
      result.sort((a, b) =>
        getProductName(a).localeCompare(getProductName(b))
      );
    }

    return result;
  }, [products, sort]);

  /* -------- Reset filters -------- */

  const resetFilters = useCallback(() => {
    setCategory("");
    setBrand("");
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setSearch("");
    setSort("newest");
  }, []);

  const filterProps = {
    categories,
    brands,
    category,
    brand,
    minPrice,
    maxPrice,
    inStockOnly,
    setCategory,
    setBrand,
    setMinPrice,
    setMaxPrice,
    setInStockOnly,
    resetFilters,
    activeFilterCount,
  };

  return (
    <main className="min-h-screen overflow-x-clip bg-slate-50">
      {/* HERO */}

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-orange-950 to-orange-700 text-white">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-orange-400/20 blur-3xl sm:h-80 sm:w-80" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <div className="mb-4 flex items-center gap-2 text-xs text-orange-200 sm:text-sm">
            <Link to="/" className="transition hover:text-white">
              Home
            </Link>
            <ChevronRight size={14} />
            <span className="text-white">Shop</span>
          </div>

          <div className="grid items-center gap-7 md:grid-cols-[1fr_auto] md:gap-10">
            <div className="max-w-2xl">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-orange-100 sm:text-sm">
                <Zap size={14} className="text-amber-300" />
                Quality Electrical Products
              </span>

              <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                Find the Right
                <span className="block text-amber-300">
                  Electrical Products
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-orange-100/80 sm:text-base sm:leading-7">
                Explore electrical essentials, LED lights, fans, wires,
                switches and more — all in one place.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-orange-100 sm:text-sm">
                <span className="flex items-center gap-2">
                  <ShieldCheck size={17} className="text-emerald-300" />
                  Quality Products
                </span>
                <span className="flex items-center gap-2">
                  <Tag size={16} className="text-amber-300" />
                  Great Prices
                </span>
              </div>
            </div>

            <div className="hidden h-36 w-36 items-center justify-center rounded-3xl border border-white/15 bg-white/10 shadow-2xl backdrop-blur-sm md:flex lg:h-44 lg:w-44">
              <ShoppingBag
                size={76}
                strokeWidth={1.2}
                className="text-amber-200 lg:h-24 lg:w-24"
              />
            </div>
          </div>

          <div className="mt-7 max-w-3xl sm:mt-9">
            <div className="flex items-center gap-3 rounded-2xl bg-white p-1.5 shadow-xl sm:p-2">
              <Search
                size={21}
                className="ml-2 shrink-0 text-slate-400 sm:ml-3"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search lights, fans, switches..."
                aria-label="Search products"
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 sm:text-base"
              />

              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X size={17} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SHOP CONTENT */}

      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="grid items-start gap-6 lg:grid-cols-[255px_minmax(0,1fr)] lg:gap-8">
          <aside className="sticky top-24 hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:block">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                <SlidersHorizontal size={18} />
                Filters
              </h2>

              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-semibold text-orange-700 hover:text-orange-900"
              >
                Clear all
              </button>
            </div>

            <FilterControls {...filterProps} />
          </aside>

          <div className="min-w-0">
            <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                  {category || "Our Products"}
                </h2>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  {loading
                    ? "Finding the right products..."
                    : `${displayedProducts.length} ${
                        displayedProducts.length === 1
                          ? "product"
                          : "products"
                      } found`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="relative flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 sm:flex-none lg:hidden"
                >
                  <Filter size={17} />
                  Filters

                  {activeFilterCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <div className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm sm:flex-none">
                  <ArrowUpDown size={16} className="shrink-0 text-slate-400" />

                  <select
                    aria-label="Sort products"
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent py-2.5 text-xs font-semibold text-slate-700 outline-none sm:text-sm"
                  >
                    <option value="newest">Newest First</option>
                    <option value="popular">Most Popular</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name: A to Z</option>
                    <option value="discount">Biggest Discount</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ACTIVE FILTER CHIPS */}

            {activeFilterCount > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {category && (
                  <button
                    type="button"
                    onClick={() => setCategory("")}
                    className="flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700"
                  >
                    {category}
                    <X size={13} />
                  </button>
                )}

                {brand && (
                  <button
                    type="button"
                    onClick={() => setBrand("")}
                    className="flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700"
                  >
                    {brand}
                    <X size={13} />
                  </button>
                )}

                {(minPrice !== "" || maxPrice !== "") && (
                  <button
                    type="button"
                    onClick={() => {
                      setMinPrice("");
                      setMaxPrice("");
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700"
                  >
                    Price range
                    <X size={13} />
                  </button>
                )}

                {inStockOnly && (
                  <button
                    type="button"
                    onClick={() => setInStockOnly(false)}
                    className="flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700"
                  >
                    In stock
                    <X size={13} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-2 py-1 text-xs font-semibold text-slate-500 underline underline-offset-2 hover:text-rose-600"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* LOADING */}

            {loading && (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >
                    <div className="aspect-square animate-pulse bg-slate-200" />
                    <div className="space-y-3 p-3 sm:p-4">
                      <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200" />
                      <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                      <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                      <div className="h-8 w-full animate-pulse rounded-xl bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ERROR */}

            {!loading && error && (
              <div className="rounded-2xl border border-rose-200 bg-white px-5 py-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <AlertCircle size={27} />
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  Unable to load products
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => setRetryCount((count) => count + 1)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
                >
                  <RotateCcw size={16} />
                  Try Again
                </button>
              </div>
            )}

            {/* PRODUCTS */}

            {!loading && !error && displayedProducts.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                {displayedProducts.map((product, index) => (
                  <ProductCard
                    key={getProductId(product) || index}
                    product={product}
                    wishlistIds={wishlistIds}
                    wishlistLoading={wishlistLoading}
                    toggleWishlist={toggleWishlist}
                    reviewStats={reviewStats}
                  />
                ))}
              </div>
            )}

            {/* EMPTY STATE */}

            {!loading && !error && displayedProducts.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center sm:py-16">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-700">
                  <PackageSearch size={32} />
                </div>

                <h3 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                  No products found
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Try another search term or remove some filters to see more
                  products.
                </p>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
                >
                  <RotateCcw size={16} />
                  Clear Filters
                </button>
              </div>
            )}

            {/* WISHLIST WARNING */}

            {wishlistError && (
              <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                <Heart size={16} className="mt-0.5 shrink-0" />
                <span>
                  Wishlist status load nahi ho paaya. Login karke dobara try
                  karein.
                </span>
                <button
                  type="button"
                  onClick={loadWishlist}
                  className="ml-auto shrink-0 font-bold underline"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && displayedProducts.length > 0 && (
              <div className="mt-7 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center text-xs text-slate-500 sm:mt-9 sm:text-sm">
                <ShieldCheck size={18} className="shrink-0 text-emerald-600" />
                Browse products and check product details before ordering.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* MOBILE FILTER DRAWER */}

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setMobileFiltersOpen(false)}
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
          />

          <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-2xl sm:max-w-md">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
                  <SlidersHorizontal size={20} />
                  Filters
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Refine your product search
                </p>
              </div>

              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <FilterControls {...filterProps} />
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-200 bg-white p-4">
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <RotateCcw size={16} />
                Reset
              </button>

              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
              >
                Show Results
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
