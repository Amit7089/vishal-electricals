
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  ShoppingBag,
  Trash2,
  ArrowRight,
  PackageSearch,
  LoaderCircle,
  RotateCcw,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import api from "../services/api";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);

const getProductId = (product) => product?._id || product?.id;

const getProductName = (product) =>
  product?.name || product?.productName || "Electrical Product";

const getProductPrice = (product) =>
  Number(product?.sellingPrice ?? product?.price ?? 0);

const getOriginalPrice = (product) =>
  Number(
    product?.originalPrice ??
      product?.compareAtPrice ??
      product?.mrp ??
      0
  );

const getProductImage = (product) => {
  const image = product?.images?.[0];

  if (typeof image === "string") return image;
  if (image?.url) return image.url;
  if (image?.secure_url) return image.secure_url;

  return product?.image || product?.imageUrl || product?.thumbnail || "";
};

const getProductStock = (product) =>
  Number(product?.stock ?? product?.quantity ?? 0);

const getProductCategory = (product) =>
  typeof product?.category === "object"
    ? product.category?.name || "Electrical"
    : product?.category || "Electrical";

const getProductLink = (product) =>
  `/product/${product?.slug || getProductId(product)}`;

function normalizeWishlist(responseData) {
  const result = responseData?.data ?? responseData;
  const wishlist = result?.wishlist;

  let items = [];

  if (Array.isArray(wishlist)) {
    items = wishlist;
  } else if (Array.isArray(wishlist?.products)) {
    items = wishlist.products;
  } else if (Array.isArray(result?.products)) {
    items = result.products;
  } else if (Array.isArray(result?.items)) {
    items = result.items;
  } else if (Array.isArray(result?.data)) {
    items = result.data;
  }

  return items
    .map((item) => item?.productId || item?.product || item)
    .filter(
      (product) =>
        product &&
        typeof product === "object" &&
        Boolean(getProductId(product))
    );
}

function WishlistImage({ product }) {
  const [imageError, setImageError] = useState(false);
  const image = getProductImage(product);

  useEffect(() => {
    setImageError(false);
  }, [image]);

  if (!image || imageError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
        <PackageSearch size={48} strokeWidth={1.3} />
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={getProductName(product)}
      loading="lazy"
      onError={() => setImageError(true)}
      className="h-full w-full object-contain p-5 transition duration-500 group-hover:scale-105 sm:p-7"
    />
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <div className="aspect-square bg-slate-100" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-1/3 rounded bg-slate-200" />
            <div className="h-5 w-4/5 rounded bg-slate-200" />
            <div className="h-5 w-1/2 rounded bg-slate-200" />
            <div className="h-10 rounded-xl bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Wishlist() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingIds, setRemovingIds] = useState(new Set());
  const [retryCount, setRetryCount] = useState(0);

  const loadWishlist = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/wishlist");
      setProducts(normalizeWishlist(response?.data));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Wishlist load nahi ho paayi. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist, retryCount]);

  const removeProduct = async (product) => {
    const id = getProductId(product);

    if (!id || removingIds.has(String(id))) return;

    const key = String(id);

    setRemovingIds((previous) => {
      const next = new Set(previous);
      next.add(key);
      return next;
    });

    try {
      await api.delete(`/wishlist/${id}`);

      setProducts((previous) =>
        previous.filter(
          (item) => String(getProductId(item)) !== key
        )
      );

      toast.success("Product wishlist se remove ho gaya.");
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Product remove nahi ho paaya."
      );
    } finally {
      setRemovingIds((previous) => {
        const next = new Set(previous);
        next.delete(key);
        return next;
      });
    }
  };

  const totalValue = products.reduce(
    (sum, product) => sum + getProductPrice(product),
    0
  );

  return (
    <main className="min-h-screen bg-[#f7f8fa] pb-12 text-slate-900">
      {/* Page header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link to="/" className="transition hover:text-orange-600">
              Home
            </Link>
            <ChevronRight size={15} />
            <Link to="/shop" className="transition hover:text-orange-600">
              Shop
            </Link>
            <ChevronRight size={15} />
            <span className="font-semibold text-slate-900">
              My Wishlist
            </span>
          </nav>

          <div className="mt-6 flex flex-col justify-between gap-5 sm:mt-8 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 sm:h-16 sm:w-16">
                <Heart size={30} strokeWidth={1.8} />
              </div>

              <div>
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  My Wishlist
                </h1>
                <p className="mt-1.5 max-w-lg text-sm leading-6 text-slate-500 sm:text-base">
                  Your favourite electrical products, saved in one place.
                </p>

                {!loading && !error && (
                  <p className="mt-2 text-sm font-semibold text-orange-600">
                    {products.length}{" "}
                    {products.length === 1 ? "product" : "products"} saved
                  </p>
                )}
              </div>
            </div>

            <Link
              to="/shop"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 sm:w-auto"
            >
              <ShoppingBag size={18} />
              Continue Shopping
              <ArrowRight size={16} />
            </Link>
          </div>

          {!loading && !error && products.length > 0 && (
            <div className="mt-7 grid grid-cols-1 gap-3 pb-5 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <Heart size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Saved items</p>
                  <p className="mt-0.5 text-lg font-extrabold">
                    {products.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Available items</p>
                  <p className="mt-0.5 text-lg font-extrabold">
                    {products.filter((p) => getProductStock(p) > 0).length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Combined listed price</p>
                  <p className="mt-0.5 text-lg font-extrabold">
                    {formatPrice(totalValue)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main content */}
      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        {loading && <LoadingState />}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-white px-5 py-14 text-center shadow-sm">
            <AlertCircle
              size={42}
              className="mx-auto mb-4 text-red-500"
            />
            <h2 className="text-xl font-extrabold">
              Could not load wishlist
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {error}
            </p>
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600"
            >
              <RotateCcw size={16} />
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="mx-auto flex max-w-xl flex-col items-center px-5 py-14 text-center sm:py-20">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                <Heart size={43} strokeWidth={1.5} />
                <span className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white">
                  <Zap size={16} />
                </span>
              </div>

              <h2 className="mt-6 text-2xl font-extrabold">
                Your wishlist is empty
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                Shop mein apne favourite products par heart button dabao.
                Tumhare saved products yahan dikhne chahiye.
              </p>

              <Link
                to="/shop"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600"
              >
                <ShoppingBag size={18} />
                Explore Products
                <ArrowRight size={17} />
              </Link>

              <div className="mt-7 flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck size={16} />
                Keep your favourite products handy
              </div>
            </div>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold sm:text-2xl">
                  Saved Products
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your selected products are ready to view.
                </p>
              </div>

              <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                {products.length}{" "}
                {products.length === 1 ? "item" : "items"}
              </span>
            </div>

            {/* Responsive product cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                const id = getProductId(product);
                const price = getProductPrice(product);
                const originalPrice = getOriginalPrice(product);
                const stock = getProductStock(product);
                const discount =
                  originalPrice > price && originalPrice > 0
                    ? Math.round(
                        ((originalPrice - price) / originalPrice) * 100
                      )
                    : 0;
                const inStock = stock > 0;
                const isRemoving = removingIds.has(String(id));

                return (
                  <article
                    key={id}
                    className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-slate-200/70"
                  >
                    {/* Product image */}
                    <div className="relative">
                      <Link
                        to={getProductLink(product)}
                        className="block aspect-square overflow-hidden bg-white"
                      >
                        <WishlistImage product={product} />
                      </Link>

                      {discount > 0 && (
                        <span className="absolute left-3 top-3 rounded-lg bg-orange-500 px-2.5 py-1.5 text-xs font-extrabold text-white shadow-sm">
                          {discount}% OFF
                        </span>
                      )}

                      <button
                        type="button"
                        disabled={isRemoving}
                        onClick={() => removeProduct(product)}
                        aria-label="Remove from wishlist"
                        title="Remove from wishlist"
                        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                      >
                        {isRemoving ? (
                          <LoaderCircle
                            size={18}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>

                      <div
                        className={`absolute bottom-3 left-3 rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                          inStock
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {inStock ? "✓ In Stock" : "Out of Stock"}
                      </div>
                    </div>

                    {/* Product information */}
                    <div className="flex flex-1 flex-col border-t border-slate-100 p-4 sm:p-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                        {getProductCategory(product)}
                      </p>

                      <Link
                        to={getProductLink(product)}
                        className="mt-2 line-clamp-2 min-h-12 text-base font-bold leading-6 text-slate-900 transition hover:text-orange-600"
                      >
                        {getProductName(product)}
                      </Link>

                      {product?.shortDescription && (
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                          {product.shortDescription}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="text-xl font-extrabold tracking-tight text-slate-900">
                          {formatPrice(price)}
                        </span>

                        {originalPrice > price && (
                          <span className="text-sm text-slate-400 line-through">
                            {formatPrice(originalPrice)}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                        <Link
                          to={getProductLink(product)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-3 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
                        >
                          View Product
                          <ArrowUpRight size={16} />
                        </Link>

                        <button
                          type="button"
                          onClick={() => removeProduct(product)}
                          disabled={isRemoving}
                          aria-label="Remove saved product"
                          title="Remove saved product"
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                        >
                          {isRemoving ? (
                            <LoaderCircle
                              size={17}
                              className="animate-spin"
                            />
                          ) : (
                            <Heart size={18} className="fill-current" />
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <ShieldCheck size={23} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Your favourites, all together
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Revisit a saved product whenever you need it.
                  </p>
                </div>
              </div>

              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
              >
                Continue Shopping
                <ArrowRight size={16} />
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
