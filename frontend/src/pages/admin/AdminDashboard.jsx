
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap,
  Package,
  ShoppingBag,
  PlusCircle,
  RefreshCw,
  LogOut,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

import api from "../../services/api";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const checkAdmin = async () => {
      try {
        const response = await api.get("/auth/me");
        const currentUser = response.data?.user;

        if (!currentUser) {
          navigate("/login", { replace: true });
          return;
        }

        if (currentUser.role !== "admin") {
          navigate("/", { replace: true });
          return;
        }

        if (active) setUser(currentUser);
      } catch (error) {
        console.error("Admin authentication error:", error);
        navigate("/login", { replace: true });
      } finally {
        if (active) setLoading(false);
      }
    };

    checkAdmin();

    return () => {
      active = false;
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const openOrders = () => {
    navigate("/admin/orders");
  };

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <RefreshCw className="animate-spin text-orange-500" size={30} />
        <span className="ml-3 text-slate-600">
          Checking admin access...
        </span>
      </main>
    );
  }

  if (!user) return null;

  const cards = [
    {
      title: "Add Product",
      description:
        "Add a product with its price, stock, category and details.",
      icon: PlusCircle,
      link: "/admin/products/new",
      label: "Add product",
    },
    {
      title: "Manage Products",
      description: "View and update your existing products.",
      icon: Package,
      link: "/admin/products",
      label: "Manage products",
    },
    {
      title: "Orders",
      description:
        "View customer orders, check payments and manage delivery status.",
      icon: ShoppingBag,
      label: "Manage orders",
      isOrders: true,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-950 p-5 text-white sm:p-7">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500">
              <Zap size={27} />
            </span>
            <div>
              <h1 className="text-xl font-extrabold sm:text-2xl">
                Vishal Electricals
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                Admin Dashboard
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10"
          >
            <LogOut size={17} />
            Logout
          </button>
        </header>

        <section className="mb-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
            <ShieldCheck size={19} />
            Verified admin access
          </div>

          <h2 className="mt-3 text-3xl font-extrabold text-slate-900">
            Welcome, {user.name}!
          </h2>

          <p className="mt-2 text-slate-500">
            Manage your store products and customer orders from one place.
          </p>
        </section>

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;

            const cardContent = (
              <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Icon size={25} />
                </div>

                <h3 className="text-xl font-bold text-slate-900">
                  {card.title}
                </h3>

                <p className="mt-2 min-h-12 flex-1 text-sm leading-6 text-slate-500">
                  {card.description}
                </p>

                <span className="mt-5 inline-flex items-center gap-2 font-bold text-orange-600">
                  {card.label}
                  <ArrowRight size={17} />
                </span>
              </article>
            );

            if (card.isOrders) {
              return (
                <button
                  key={card.title}
                  type="button"
                  onClick={openOrders}
                  className="group block w-full cursor-pointer rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-4"
                  aria-label="Open order management"
                >
                  {cardContent}
                </button>
              );
            }

            return (
              <Link
                key={card.title}
                to={card.link}
                className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-4"
              >
                {cardContent}
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
