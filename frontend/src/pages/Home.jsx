
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Heart,
  Lightbulb,
  Menu,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import api from "../services/api";

const categories = [
  {
    name: "LED Lights",
    subtitle: "Bright ideas, lower bills",
    icon: "💡",
    color: "amber",
    search: "LED Lights",
  },
  {
    name: "Fans",
    subtitle: "Comfort in every season",
    icon: "🌀",
    color: "blue",
    search: "Fans",
  },
  {
    name: "Wires & Cables",
    subtitle: "Power you can trust",
    icon: "🔌",
    color: "violet",
    search: "Wires & Cables",
  },
  {
    name: "Switches",
    subtitle: "The perfect connection",
    icon: "🎛️",
    color: "pink",
    search: "Switches",
  },
  {
    name: "Coolers",
    subtitle: "Stay cool, stay fresh",
    icon: "❄️",
    color: "cyan",
    search: "Coolers",
  },
  {
    name: "Electrical Appliances",
    subtitle: "Smart everyday essentials",
    icon: "⚡",
    color: "orange",
    search: "Electrical Appliances",
  },
];

const benefits = [
  {
    icon: Truck,
    title: "Convenient shopping",
    description: "Shop your electrical essentials online.",
  },
  {
    icon: ShieldCheck,
    title: "Quality first",
    description: "Find products for your everyday needs.",
  },
  {
    icon: BadgeCheck,
    title: "Reliable service",
    description: "A smoother shopping experience.",
  },
  {
    icon: PackageCheck,
    title: "Easy browsing",
    description: "Discover products by category.",
  },
];

const imageFallback =
  "https://images.unsplash.com/photo-1558008258-3256797b43f3?auto=format&fit=crop&w=900&q=85";

function getProductId(product) {
  return product?._id || product?.id;
}

function getProductImage(product) {
  const firstImage = product?.images?.[0];

  if (typeof firstImage === "string") return firstImage;
  if (firstImage?.url) return firstImage.url;

  return (
    product?.image ||
    product?.imageUrl ||
    product?.thumbnail ||
    imageFallback
  );
}

function getPrice(product) {
  return Number(product?.price ?? product?.sellingPrice ?? 0);
}

function getOriginalPrice(product) {
  return Number(
    product?.compareAtPrice ??
      product?.mrp ??
      product?.originalPrice ??
      0
  );
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function getList(data, keys = []) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getProductPath(product) {
  const identifier = product?.slug || getProductId(product);
  return identifier ? `/product/${identifier}` : "/shop";
}

function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (
      typeof IntersectionObserver === "undefined"
    ) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`ve-reveal ${visible ? "ve-visible" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function Rating({ rating = 0, count = 0 }) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 font-bold text-amber-700">
        {value ? value.toFixed(1) : "New"}
        <Star size={12} fill="currentColor" />
      </span>
      {Number(count) > 0 && (
        <span className="text-slate-400">
          ({count} {Number(count) === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  );
}

function ProductCard({
  product,
  index,
  isWishlisted,
  onWishlist,
  ratingInfo,
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const price = getPrice(product);
  const originalPrice = getOriginalPrice(product);
  const discount =
    originalPrice > price && originalPrice > 0
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  const productId = getProductId(product);
  const stock = product?.stock ?? product?.quantity;
  const outOfStock =
    product?.inStock === false ||
    product?.isAvailable === false ||
    (stock !== undefined && Number(stock) <= 0);

  const image = imageFailed ? imageFallback : getProductImage(product);

  return (
    <article
      className="ve-product-card group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-slate-100 bg-white"
      style={{ animationDelay: `${index * 65}ms` }}
    >
      <div className="relative mx-2 mt-2 overflow-hidden rounded-[17px] bg-[#f5f7fa]">
        <Link
          to={getProductPath(product)}
          aria-label={`View ${product?.name || "product"}`}
          className="relative flex aspect-[1/1] items-center justify-center overflow-hidden"
        >
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-100 via-white to-slate-100" />
          )}

          <img
            src={image}
            alt={product?.name || "Electrical product"}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              if (!imageFailed) {
                setImageFailed(true);
                setImageLoaded(true);
              }
            }}
            className={`relative z-[1] h-full w-full object-contain p-4 transition duration-700 ease-out group-hover:scale-[1.08] ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        </Link>

        {discount > 0 && (
          <span className="absolute left-3 top-3 z-[2] rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-white shadow-sm">
            {discount}% OFF
          </span>
        )}

        {product?.featured && (
          <span className="absolute bottom-3 left-3 z-[2] rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-slate-700 shadow-sm backdrop-blur">
            <Sparkles size={11} className="mr-1 inline text-orange-500" />
            Featured
          </span>
        )}

        <button
          type="button"
          onClick={() => onWishlist(productId)}
          disabled={!productId}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          className={`absolute right-3 top-3 z-[3] flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition duration-300 hover:scale-110 disabled:cursor-not-allowed ${
            isWishlisted
              ? "border-rose-100 bg-rose-50 text-rose-500"
              : "border-white/80 bg-white/90 text-slate-500 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-500"
          }`}
        >
          <Heart
            size={18}
            fill={isWishlisted ? "currentColor" : "none"}
          />
        </button>

        {outOfStock && (
          <span className="absolute inset-x-0 bottom-0 z-[2] bg-slate-900/75 px-3 py-2 text-center text-xs font-bold text-white backdrop-blur-sm">
            Currently unavailable
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 pt-3">
        <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-orange-500">
          {product?.brand || product?.category || "Vishal Electricals"}
        </p>

        <Link
          to={getProductPath(product)}
          className="line-clamp-2 min-h-[42px] text-sm font-bold leading-5 text-slate-800 transition hover:text-orange-600"
        >
          {product?.name || "Electrical Product"}
        </Link>

        <div className="mt-2">
          <Rating
            rating={ratingInfo?.rating}
            count={ratingInfo?.count}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-lg font-black tracking-tight text-slate-900">
            {formatPrice(price)}
          </span>
          {originalPrice > price && (
            <span className="text-xs font-medium text-slate-400 line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        <Link
          to={getProductPath(product)}
          className="ve-product-action mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white transition duration-300 hover:bg-orange-500"
        >
          View product
          <ArrowUpRight size={15} />
        </Link>
      </div>
    </article>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [wishlistBusy, setWishlistBusy] = useState({});
  const [wishlistMessage, setWishlistMessage] = useState("");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await api.get("/products", {
        params: {
          limit: 8,
          page: 1,
          sort: "newest",
        },
      });

      const list = getList(response?.data, [
        "products",
        "items",
        "results",
      ]);

      setProducts(list);

      // Load ratings for the products shown on the homepage.
      const ratingResults = await Promise.all(
        list.map(async (product) => {
          const id = getProductId(product);
          if (!id) return null;

          try {
            const reviewResponse = await api.get(`/reviews/${id}`);
            const reviewData = reviewResponse?.data;
            const reviewList = getList(reviewData, [
              "reviews",
              "items",
              "results",
            ]);

            const average =
              reviewData?.averageRating ??
              reviewData?.average ??
              reviewData?.rating ??
              0;

            const count =
              reviewData?.totalReviews ??
              reviewData?.count ??
              reviewData?.total ??
              reviewList.length;

            return [
              id,
              {
                rating: Number(average) || 0,
                count: Number(count) || 0,
              },
            ];
          } catch {
            return [id, { rating: 0, count: 0 }];
          }
        })
      );

      setRatings(Object.fromEntries(ratingResults.filter(Boolean)));
    } catch (error) {
      console.error("Unable to load homepage products:", error);
      setLoadError("Products abhi load nahi ho paaye. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWishlist = useCallback(async () => {
    try {
      const response = await api.get("/wishlist");
      const items = getList(response?.data, [
        "wishlist",
        "items",
        "products",
        "results",
      ]);

      setWishlistIds(
        items
          .map((item) =>
            typeof item === "string"
              ? item
              : getProductId(item?.product || item)
          )
          .filter(Boolean)
          .map(String)
      );
    } catch (error) {
      // Guests or logged-out users may not have access to wishlist yet.
      console.info("Wishlist is not available for this session.");
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadWishlist();
  }, [loadProducts, loadWishlist]);

  const handleWishlist = async (productId) => {
    if (!productId || wishlistBusy[productId]) return;

    const id = String(productId);
    const alreadySaved = wishlistIds.includes(id);

    setWishlistBusy((current) => ({ ...current, [id]: true }));
    setWishlistMessage("");

    try {
      if (alreadySaved) {
        await api.delete(`/wishlist/${productId}`);
        setWishlistIds((current) =>
          current.filter((item) => item !== id)
        );
        setWishlistMessage("Product wishlist se remove ho gaya.");
      } else {
        await api.post(`/wishlist/${productId}`);
        setWishlistIds((current) =>
          current.includes(id) ? current : [...current, id]
        );
        setWishlistMessage("Product wishlist mein add ho gaya.");
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "Wishlist update nahi ho paayi. Login karke dobara try karein.";
      setWishlistMessage(message);
    } finally {
      setWishlistBusy((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    }
  };

  const featuredProducts = products.filter(
    (product) => product?.featured || product?.isFeatured
  );

  const displayProducts =
    featuredProducts.length > 0
      ? featuredProducts.slice(0, 4)
      : products.slice(0, 4);

  const newArrivals = products.slice(0, 8);

  return (
    <main className="ve-home overflow-hidden bg-white text-slate-900">
      <style>{`
        .ve-home {
          --ve-orange: #ff6b22;
          --ve-orange-dark: #ed5011;
          --ve-ink: #10172a;
        }

        .ve-home * {
          box-sizing: border-box;
        }

        .ve-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition:
            opacity 650ms ease,
            transform 650ms cubic-bezier(.2,.7,.2,1);
          transition-delay: var(--reveal-delay, 0ms);
        }

        .ve-reveal.ve-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .ve-hero {
          isolation: isolate;
          background:
            radial-gradient(ellipse at 82% 15%, rgba(255, 127, 52, .22), transparent 34%),
            radial-gradient(ellipse at 12% 95%, rgba(77, 108, 255, .18), transparent 38%),
            linear-gradient(120deg, #11172b 0%, #1a2441 54%, #242b4b 100%);
        }

        .ve-hero::before {
          content: "";
          position: absolute;
          z-index: -1;
          inset: 0;
          pointer-events: none;
          opacity: .15;
          background-image: radial-gradient(rgba(255,255,255,.65) .7px, transparent .7px);
          background-size: 22px 22px;
          mask-image: linear-gradient(90deg, black, transparent 90%);
        }

        .ve-orbit {
          position: absolute;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 9999px;
          pointer-events: none;
          animation: ve-orbit 24s linear infinite;
        }

        .ve-orbit-one {
          width: 520px;
          height: 520px;
          right: -120px;
          top: -190px;
        }

        .ve-orbit-two {
          width: 360px;
          height: 360px;
          right: -40px;
          top: -110px;
          animation-direction: reverse;
          animation-duration: 18s;
        }

        .ve-float {
          animation: ve-float 5s ease-in-out infinite;
        }

        .ve-float-delayed {
          animation: ve-float 5.8s ease-in-out infinite;
          animation-delay: -1.8s;
        }

        .ve-hero-enter {
          animation: ve-enter .85s cubic-bezier(.2,.8,.2,1) both;
        }

        .ve-hero-enter-delay {
          animation: ve-enter 1s .15s cubic-bezier(.2,.8,.2,1) both;
        }

        .ve-product-card {
          box-shadow: 0 3px 12px rgba(15,23,42,.025);
          transition:
            transform 300ms ease,
            box-shadow 300ms ease,
            border-color 300ms ease;
          animation: ve-card-in .55s both;
        }

        .ve-product-card:hover {
          transform: translateY(-6px);
          border-color: #fed7aa;
          box-shadow: 0 18px 35px rgba(15,23,42,.09);
        }

        .ve-category-card {
          transition: transform 280ms ease, box-shadow 280ms ease;
        }

        .ve-category-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 28px rgba(15,23,42,.08);
        }

        .ve-category-icon {
          transition: transform 300ms ease;
        }

        .ve-category-card:hover .ve-category-icon {
          transform: rotate(-7deg) scale(1.12);
        }

        .ve-glow-button {
          position: relative;
          overflow: hidden;
        }

        .ve-glow-button::after {
          content: "";
          position: absolute;
          top: -50%;
          left: -70%;
          width: 45%;
          height: 200%;
          transform: rotate(20deg);
          background: rgba(255,255,255,.22);
          transition: left 500ms ease;
        }

        .ve-glow-button:hover::after {
          left: 130%;
        }

        .ve-marquee {
          animation: ve-marquee 28s linear infinite;
        }

        @keyframes ve-enter {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes ve-float {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }

        @keyframes ve-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes ve-card-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes ve-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .ve-home *,
          .ve-home *::before,
          .ve-home *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: .01ms !important;
          }

          .ve-reveal {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>

      {/* HERO */}
      <section className="ve-hero relative overflow-hidden text-white">
        <div className="ve-orbit ve-orbit-one" />
        <div className="ve-orbit ve-orbit-two" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-9 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.03fr_.97fr] lg:gap-5 lg:px-8 lg:py-[76px]">
          <div className="relative z-10">
            <div className="ve-hero-enter mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-2 text-xs font-semibold text-orange-100 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-400" />
              </span>
              Your everyday electrical store
            </div>

            <h1 className="ve-hero-enter max-w-2xl text-[2.65rem] font-black leading-[1.06] tracking-[-.045em] sm:text-6xl lg:text-[4.25rem]">
              Power your world.
              <span className="mt-1 block text-orange-400">
                Light up life.
              </span>
            </h1>

            <p className="ve-hero-enter-delay mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
              Discover lighting, fans, wires, switches and everyday electrical
              essentials — all in one place.
            </p>

            <div className="ve-hero-enter-delay mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/shop"
                className="ve-glow-button inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-orange-950/20 transition hover:-translate-y-0.5 hover:bg-orange-400"
              >
                Explore products
                <ArrowRight size={17} />
              </Link>

              <Link
                to="/shop?category=LED%20Lights"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/10"
              >
                <Lightbulb size={17} className="text-orange-300" />
                Shop lighting
              </Link>
            </div>

            <div className="ve-hero-enter-delay mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-slate-300">
              <span className="flex items-center gap-2">
                <Check size={15} className="text-emerald-400" />
                Easy product discovery
              </span>
              <span className="flex items-center gap-2">
                <Check size={15} className="text-emerald-400" />
                Everyday essentials
              </span>
            </div>
          </div>

          {/* Product collage */}
          <div className="ve-hero-enter-delay relative mx-auto w-full max-w-[570px] lg:ml-auto">
            <div className="absolute inset-8 rounded-full bg-orange-500/20 blur-3xl" />

            <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
              <div className="ve-float relative col-span-2 overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.08] p-3 shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-4">
                <div className="relative h-[185px] overflow-hidden rounded-[18px] sm:h-[230px]">
                  <img
                    src="https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1100&q=85"
                    alt="Warm modern interior lighting"
                    className="h-full w-full object-cover transition duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
                      Bright ideas
                    </span>
                    <p className="mt-2 text-xl font-extrabold text-white sm:text-2xl">
                      Light every corner
                    </p>
                  </div>
                  <div className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-orange-500 shadow-lg">
                    <Lightbulb size={20} />
                  </div>
                </div>
              </div>

              <div className="ve-float-delayed overflow-hidden rounded-[22px] border border-white/10 bg-white p-2.5 shadow-xl shadow-black/10 sm:p-3">
                <div className="relative flex h-[130px] items-center justify-center overflow-hidden rounded-[16px] bg-[#f3f6fb] sm:h-[155px]">
                  <img
                    src="https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=550&q=80"
                    alt="Home lighting inspiration"
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 hover:scale-110"
                  />
                  <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold text-slate-800 shadow">
                    LED lighting
                  </span>
                </div>
                <div className="flex items-center justify-between px-1 pb-1 pt-3">
                  <span className="text-xs font-extrabold text-slate-800 sm:text-sm">
                    Light smarter
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                    <ArrowUpRight size={15} />
                  </span>
                </div>
              </div>

              <div className="ve-float relative mt-5 overflow-hidden rounded-[22px] border border-white/10 bg-gradient-to-br from-orange-400 to-orange-600 p-3 shadow-xl shadow-orange-950/20 sm:mt-7 sm:p-4">
                <div className="absolute -right-7 -top-7 h-28 w-28 rounded-full border-[18px] border-white/15" />
                <div className="relative flex h-[130px] items-center justify-center overflow-hidden rounded-[16px] bg-white/95 sm:h-[155px]">
                  <img
                    src="https://images.unsplash.com/photo-1558008258-3256797b43f3?auto=format&fit=crop&w=600&q=85"
                    alt="Modern electrical and lighting products"
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 hover:scale-110"
                  />
                  <span className="absolute bottom-2 left-2 rounded-full bg-slate-900/85 px-2.5 py-1 text-[10px] font-extrabold text-white">
                    Home essentials
                  </span>
                </div>
                <div className="relative flex items-center justify-between px-1 pb-1 pt-3 text-white">
                  <span className="text-xs font-extrabold sm:text-sm">
                    Power your space
                  </span>
                  <Zap size={18} fill="currentColor" />
                </div>
              </div>
            </div>

            <div className="absolute -left-2 top-[42%] hidden items-center gap-2 rounded-2xl border border-white/15 bg-[#252d48]/95 px-3 py-2.5 shadow-xl backdrop-blur sm:flex lg:-left-7">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
                <Zap size={19} />
              </span>
              <span>
                <span className="block text-xs font-extrabold">Power up</span>
                <span className="block text-[10px] text-slate-300">
                  Your everyday
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-white/[0.035]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-4 text-[11px] font-bold tracking-wide text-slate-300 sm:gap-x-12 sm:text-xs">
            <span className="flex items-center gap-2">
              <Lightbulb size={15} className="text-orange-400" />
              LIGHTING
            </span>
            <span className="flex items-center gap-2">
              <Zap size={15} className="text-orange-400" />
              ELECTRICALS
            </span>
            <span className="flex items-center gap-2">
              <Sparkles size={15} className="text-orange-400" />
              HOME ESSENTIALS
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-orange-400" />
              QUALITY PICKS
            </span>
          </div>
        </div>
      </section>

      {/* CATEGORY SECTION */}
      <section className="bg-[#f8fafc] py-14 sm:py-[72px]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-7 flex items-end justify-between gap-4 sm:mb-9">
              <div>
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[.2em] text-orange-500">
                  Find your essentials
                </p>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  Shop by category
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Everything for your home, shop and workspace.
                </p>
              </div>
              <Link
                to="/shop"
                className="hidden items-center gap-1 text-sm font-bold text-orange-600 transition hover:gap-2 sm:inline-flex"
              >
                All categories <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {categories.map((category, index) => (
              <Reveal key={category.name} delay={index * 65}>
                <Link
                  to={`/shop?category=${encodeURIComponent(category.search)}`}
                  className={`ve-category-card group block h-full rounded-[20px] border border-white bg-white p-4 shadow-sm sm:p-5`}
                >
                  <div
                    className={`ve-category-icon mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-[28px] ${
                      category.color === "amber"
                        ? "bg-amber-50"
                        : category.color === "blue"
                        ? "bg-blue-50"
                        : category.color === "violet"
                        ? "bg-violet-50"
                        : category.color === "pink"
                        ? "bg-pink-50"
                        : category.color === "cyan"
                        ? "bg-cyan-50"
                        : "bg-orange-50"
                    }`}
                  >
                    {category.icon}
                  </div>
                  <h3 className="text-sm font-extrabold leading-5 text-slate-800 transition group-hover:text-orange-600">
                    {category.name}
                  </h3>
                  <p className="mt-1.5 min-h-[32px] text-[11px] leading-4 text-slate-500">
                    {category.subtitle}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-[11px] font-extrabold text-orange-600">
                    Explore
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-50 transition group-hover:bg-orange-500 group-hover:text-white">
                      <ArrowUpRight size={14} />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          <Link
            to="/shop"
            className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-orange-600 sm:hidden"
          >
            Explore all products <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="py-14 sm:py-[76px]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.2em] text-orange-500">
                  <Sparkles size={14} />
                  Handpicked for you
                </div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  Featured products
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Useful picks for your next electrical upgrade.
                </p>
              </div>

              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 sm:text-sm"
              >
                View all products
                <ArrowRight size={15} />
              </Link>
            </div>
          </Reveal>

          {wishlistMessage && (
            <div
              role="status"
              className="mb-5 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-800"
            >
              {wishlistMessage}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse overflow-hidden rounded-[22px] border border-slate-100 p-2"
                >
                  <div className="aspect-square rounded-[17px] bg-slate-100" />
                  <div className="space-y-3 p-3">
                    <div className="h-3 w-1/3 rounded bg-slate-100" />
                    <div className="h-4 w-4/5 rounded bg-slate-100" />
                    <div className="h-5 w-1/2 rounded bg-slate-100" />
                    <div className="h-10 rounded-xl bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-10 text-center">
              <p className="text-sm font-semibold text-rose-700">
                {loadError}
              </p>
              <button
                type="button"
                onClick={loadProducts}
                className="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500"
              >
                Try again
              </button>
            </div>
          ) : displayProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {displayProducts.map((product, index) => {
                const id = getProductId(product);
                return (
                  <ProductCard
                    key={id || product?.slug || product?.name || index}
                    product={product}
                    index={index}
                    isWishlisted={wishlistIds.includes(String(id))}
                    onWishlist={handleWishlist}
                    ratingInfo={ratings[id]}
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <ShoppingBag size={25} />
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-slate-800">
                Products are coming soon
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                New electrical essentials will appear here once they are
                available in the store.
              </p>
              <Link
                to="/shop"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                Visit shop <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* COLORFUL PROMO BANNER */}
      <section className="px-4 pb-14 sm:px-6 sm:pb-[76px] lg:px-8">
        <Reveal>
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-gradient-to-r from-orange-500 via-[#ff742c] to-amber-400 shadow-xl shadow-orange-500/15">
            <div className="absolute -right-12 -top-24 h-72 w-72 rounded-full border-[36px] border-white/10" />
            <div className="absolute -bottom-24 right-[28%] h-52 w-52 rounded-full bg-white/10 blur-2xl" />

            <div className="relative grid items-center gap-7 px-6 py-9 sm:px-10 sm:py-12 lg:grid-cols-[1fr_auto] lg:px-14 lg:py-14">
              <div className="max-w-2xl text-white">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.17em]">
                  <Zap size={13} />
                  Upgrade your space
                </span>
                <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-[42px]">
                  Small upgrades.
                  <span className="block text-orange-950/80">
                    Big difference.
                  </span>
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-7 text-white/90 sm:text-base">
                  Find the right lights, fans, switches and electrical
                  essentials for your next project.
                </p>
                <Link
                  to="/shop"
                  className="ve-glow-button mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  Browse the store <ArrowRight size={17} />
                </Link>
              </div>

              <div className="relative hidden h-44 w-44 items-center justify-center rounded-full border border-white/30 bg-white/15 backdrop-blur-sm sm:flex lg:h-52 lg:w-52">
                <div className="absolute inset-3 rounded-full border border-dashed border-white/50" />
                <div className="flex h-28 w-28 items-center justify-center rounded-[32px] bg-white text-orange-500 shadow-2xl sm:h-32 sm:w-32">
                  <Lightbulb size={65} strokeWidth={1.5} />
                </div>
                <Sparkles className="absolute right-2 top-4 text-white" size={25} />
                <Zap className="absolute bottom-5 left-1 text-white" size={22} />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* NEW ARRIVALS */}
      <section className="bg-[#f8fafc] py-14 sm:py-[76px]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[.2em] text-orange-500">
                  Fresh in the store
                </p>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  New arrivals
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Take a look at the latest products added to our catalogue.
                </p>
              </div>
              <Link
                to="/shop"
                className="hidden items-center gap-1 text-sm font-bold text-orange-600 hover:gap-2 sm:inline-flex"
              >
                Explore shop <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="animate-pulse rounded-2xl bg-white p-3">
                  <div className="aspect-square rounded-xl bg-slate-100" />
                  <div className="mt-4 h-4 rounded bg-slate-100" />
                  <div className="mt-3 h-5 w-1/2 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : newArrivals.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {newArrivals.slice(0, 4).map((product, index) => {
                const id = getProductId(product);
                return (
                  <ProductCard
                    key={id || product?.slug || product?.name || index}
                    product={product}
                    index={index}
                    isWishlisted={wishlistIds.includes(String(id))}
                    onWishlist={handleWishlist}
                    ratingInfo={ratings[id]}
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              New arrivals will be displayed here when available.
            </div>
          )}

          <Link
            to="/shop"
            className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-orange-600 sm:hidden"
          >
            View all products <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* WHY SHOP WITH US */}
      <section className="py-14 sm:py-[76px]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.18em] text-orange-600">
                <BadgeCheck size={13} />
                The Vishal experience
              </span>
              <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Shopping made simple
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                A convenient place to explore electrical products for everyday
                needs.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Reveal key={benefit.title} delay={index * 70}>
                  <div className="group h-full rounded-[20px] border border-slate-100 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-orange-100 hover:shadow-lg hover:shadow-slate-900/5 sm:p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 transition duration-300 group-hover:rotate-[-5deg] group-hover:bg-orange-500 group-hover:text-white">
                      <Icon size={22} />
                    </div>
                    <h3 className="mt-5 text-sm font-extrabold text-slate-800">
                      {benefit.title}
                    </h3>
                    <p className="mt-2 text-xs leading-6 text-slate-500">
                      {benefit.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="px-4 pb-14 sm:px-6 sm:pb-[76px] lg:px-8">
        <Reveal>
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-[26px] border border-slate-100 bg-[#f8fafc] px-6 py-8 sm:flex-row sm:items-center sm:px-9 sm:py-9">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-orange-400">
                <ShoppingBag size={23} />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">
                  Ready to find what you need?
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Explore our categories and find the right product for your
                  home, shop or next project.
                </p>
              </div>
            </div>
            <Link
              to="/shop"
              className="ve-glow-button inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-orange-600"
            >
              Start shopping <ArrowRight size={17} />
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
