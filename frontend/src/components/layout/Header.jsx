
import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  ShoppingCart,
  Search,
  Menu,
  X,
  UserRound,
  LogIn,
  UserPlus,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  Heart,
  Zap,
  Package,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";

import api from "../../services/api";
import { useCart } from "../../context/CartContext";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount } = useCart();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const isAdmin =
    user?.role === "admin" || user?.role === "Admin";

  // Login user ki information load karein
  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      try {
        const response = await api.get("/auth/me");

        if (isMounted) {
          const data = response.data;

          setUser(
            data?.user ??
              data?.data?.user ??
              data?.data ??
              (data?._id || data?.email ? data : null)
          );
        }
      } catch (error) {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoadingUser(false);
        }
      }
    };

    setLoadingUser(true);
    fetchUser();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  // Route change hone par menus band karein
  useEffect(() => {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  }, [location.pathname, location.search]);

  // Search handle karein
  const handleSearch = (event) => {
    event.preventDefault();

    const query = searchText.trim();

    if (!query) {
      toast.error("Please enter a product name");
      return;
    }

    navigate(`/shop?search=${encodeURIComponent(query)}`);
    setMobileMenuOpen(false);
  };

  // Logout handle karein
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");

      setUser(null);
      setAccountMenuOpen(false);
      setMobileMenuOpen(false);

      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Logout failed. Please try again."
      );
    }
  };

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
      isActive
        ? "bg-amber-50 text-amber-700"
        : "text-slate-700 hover:bg-slate-100 hover:text-amber-700"
    }`;

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      {/* Top announcement bar */}
      <div className="bg-slate-900 px-4 py-2 text-center text-xs font-medium text-white sm:text-sm">
        <span className="inline-flex items-center justify-center gap-2">
          <Zap size={14} className="text-amber-400" />
          Quality Electrical Products at Great Prices
        </span>
      </div>

      {/* Main header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[76px] items-center justify-between gap-3">
          {/* Logo */}
          <Link
            to="/"
            onClick={closeMobileMenu}
            className="flex shrink-0 items-center gap-2"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
              <Zap size={25} strokeWidth={2.5} />
            </div>

            <div className="leading-tight">
              <span className="block text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
                Vishal
                <span className="text-amber-600">
                  {" "}Electricals
                </span>
              </span>

              <span className="text-[10px] font-medium uppercase tracking-[2px] text-slate-500">
                Powering Your Home
              </span>
            </div>
          </Link>

          {/* Desktop search */}
          <form
            onSubmit={handleSearch}
            className="mx-4 hidden max-w-xl flex-1 md:flex"
          >
            <div className="flex w-full items-center rounded-xl border border-slate-200 bg-slate-50 transition focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-100">
              <Search
                size={19}
                className="ml-4 shrink-0 text-slate-400"
              />

              <input
                type="search"
                value={searchText}
                onChange={(event) =>
                  setSearchText(event.target.value)
                }
                placeholder="Search lights, fans, wires..."
                aria-label="Search products"
                className="w-full bg-transparent px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />

              <button
                type="submit"
                className="m-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-600"
              >
                Search
              </button>
            </div>
          </form>

          {/* Desktop account, wishlist and cart */}
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setAccountMenuOpen((previous) => !previous)
                  }
                  className="flex items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-slate-100"
                  aria-expanded={accountMenuOpen}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <UserRound size={19} />
                  </span>

                  <span className="max-w-28 truncate text-left text-sm font-semibold text-slate-800">
                    {user.fullName ||
                      user.name ||
                      user.email ||
                      "My Account"}
                  </span>

                  <ChevronDown size={15} />
                </button>

                {accountMenuOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Close account menu"
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setAccountMenuOpen(false)}
                    />

                    <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                      <div className="border-b border-slate-100 px-3 py-3">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {user.fullName || user.name || "Welcome"}
                        </p>

                        <p className="truncate text-xs text-slate-500">
                          {user.email || ""}
                        </p>
                      </div>

                      {isAdmin ? (
                        <Link
                          to="/admin"
                          onClick={() => setAccountMenuOpen(false)}
                          className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-700"
                        >
                          <LayoutDashboard size={17} />
                          Admin Dashboard
                        </Link>
                      ) : (
                        <Link
                          to="/account"
                          onClick={() => setAccountMenuOpen(false)}
                          className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-700"
                        >
                          <UserRound size={17} />
                          My Account
                        </Link>
                      )}

                      {!isAdmin && (
                        <Link
                          to="/my-orders"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-700"
                        >
                          <ClipboardList size={17} />
                          My Orders
                        </Link>
                      )}

                      {/* Wishlist inside account menu */}
                      <Link
                        to="/wishlist"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-700"
                      >
                        <Heart size={17} />
                        My Wishlist
                      </Link>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={17} />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <LogIn size={17} />
                  Login
                </Link>

                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-amber-600"
                >
                  <UserPlus size={17} />
                  Register
                </Link>
              </div>
            )}

            {/* Wishlist shortcut */}
            <Link
              to="/wishlist"
              aria-label="Open wishlist"
              title="My Wishlist"
              className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
                location.pathname === "/wishlist"
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-slate-200 text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
              }`}
            >
              <Heart
                size={22}
                fill={
                  location.pathname === "/wishlist"
                    ? "currentColor"
                    : "none"
                }
              />
            </Link>

            {/* Live cart count */}
            <Link
              to="/cart"
              aria-label={`Shopping cart, ${cartCount} items`}
              title="Shopping Cart"
              className="relative ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
            >
              <ShoppingCart size={22} />

              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-extrabold text-white ring-2 ring-white">
                {cartCount}
              </span>
            </Link>
          </div>

          {/* Mobile wishlist, cart and menu buttons */}
          <div className="flex shrink-0 items-center gap-2 sm:hidden">
            <Link
              to="/wishlist"
              aria-label="Open wishlist"
              title="My Wishlist"
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                location.pathname === "/wishlist"
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-slate-200 text-slate-700 hover:bg-amber-50"
              }`}
            >
              <Heart
                size={21}
                fill={
                  location.pathname === "/wishlist"
                    ? "currentColor"
                    : "none"
                }
              />
            </Link>

            <Link
              to="/cart"
              aria-label={`Shopping cart, ${cartCount} items`}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700"
            >
              <ShoppingCart size={21} />

              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-extrabold text-white ring-2 ring-white">
                {cartCount}
              </span>
            </Link>

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen((previous) => !previous)
              }
              aria-label={
                mobileMenuOpen ? "Close menu" : "Open menu"
              }
              aria-expanded={mobileMenuOpen}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700"
            >
              {mobileMenuOpen ? (
                <X size={22} />
              ) : (
                <Menu size={22} />
              )}
            </button>
          </div>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden items-center justify-between border-t border-slate-100 py-2 sm:flex">
          <div className="flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>

            <NavLink to="/shop" className={navLinkClass}>
              <Package size={17} />
              Shop All
            </NavLink>

            <NavLink
              to="/shop?category=LED%20Lights"
              className={navLinkClass}
            >
              LED Lights
            </NavLink>

            <NavLink
              to="/shop?category=Fans"
              className={navLinkClass}
            >
              Fans
            </NavLink>

            <NavLink
              to="/shop?category=Wires%20%26%20Cables"
              className={navLinkClass}
            >
              Wires &amp; Cables
            </NavLink>

            <NavLink
              to="/shop?category=Switches"
              className={navLinkClass}
            >
              Switches
            </NavLink>

            <NavLink
              to="/shop?category=Coolers"
              className={navLinkClass}
            >
              Coolers
            </NavLink>
          </div>

          <Link
            to="/shop?sort=popular"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-amber-700 transition hover:bg-amber-50"
          >
            <Zap size={16} />
            Popular Products
          </Link>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 py-4 sm:hidden">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50">
                <Search
                  size={18}
                  className="ml-3 shrink-0 text-slate-400"
                />

                <input
                  type="search"
                  value={searchText}
                  onChange={(event) =>
                    setSearchText(event.target.value)
                  }
                  placeholder="Search products..."
                  aria-label="Search products"
                  className="w-full min-w-0 bg-transparent px-3 py-3 text-sm outline-none"
                />

                <button
                  type="submit"
                  aria-label="Search"
                  className="m-1 rounded-lg bg-amber-500 p-2 text-white"
                >
                  <Search size={17} />
                </button>
              </div>
            </form>

            {/* Mobile wishlist link */}
            <Link
              to="/wishlist"
              onClick={closeMobileMenu}
              className={`mb-3 flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-bold transition ${
                location.pathname === "/wishlist"
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-slate-200 text-slate-700 hover:border-amber-200 hover:bg-amber-50"
              }`}
            >
              <Heart
                size={19}
                fill={
                  location.pathname === "/wishlist"
                    ? "currentColor"
                    : "none"
                }
              />
              My Wishlist
              <span className="ml-auto text-xs font-medium text-slate-500">
                Saved products
              </span>
            </Link>

            <nav className="grid gap-1">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-amber-50"
              >
                Home
              </Link>

              <Link
                to="/shop"
                onClick={closeMobileMenu}
                className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-amber-50"
              >
                <Package size={17} />
                Shop All Products
              </Link>

              <Link
                to="/shop?category=LED%20Lights"
                onClick={closeMobileMenu}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-amber-50"
              >
                LED Lights
              </Link>

              <Link
                to="/shop?category=Fans"
                onClick={closeMobileMenu}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-amber-50"
              >
                Fans
              </Link>

              <Link
                to="/shop?category=Wires%20%26%20Cables"
                onClick={closeMobileMenu}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-amber-50"
              >
                Wires &amp; Cables
              </Link>

              <Link
                to="/shop?category=Switches"
                onClick={closeMobileMenu}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-amber-50"
              >
                Switches
              </Link>

              <Link
                to="/shop?category=Coolers"
                onClick={closeMobileMenu}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-amber-50"
              >
                Coolers
              </Link>

              <Link
                to="/shop?sort=popular"
                onClick={closeMobileMenu}
                className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-50"
              >
                <Zap size={17} />
                Popular Products
              </Link>
            </nav>

            {/* Mobile account section */}
            <div className="mt-4 border-t border-slate-100 pt-4">
              {loadingUser ? (
                <p className="px-3 py-2 text-sm text-slate-500">
                  Loading account...
                </p>
              ) : user ? (
                <>
                  <div className="mb-2 flex items-center gap-3 px-3 py-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <UserRound size={20} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {user.fullName || user.name || "My Account"}
                      </p>

                      <p className="truncate text-xs text-slate-500">
                        {user.email || ""}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={isAdmin ? "/admin" : "/account"}
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-amber-50"
                  >
                    <LayoutDashboard size={18} />
                    {isAdmin ? "Admin Dashboard" : "My Account"}
                  </Link>

                  {!isAdmin && (
                    <Link
                      to="/my-orders"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-amber-50"
                    >
                      <ClipboardList size={18} />
                      My Orders
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold text-slate-700"
                  >
                    <LogIn size={17} />
                    Login
                  </Link>

                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 py-3 text-sm font-bold text-white"
                  >
                    <UserPlus size={17} />
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
