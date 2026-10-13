
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  RefreshCw,
  ShoppingBag,
  CalendarDays,
  CreditCard,
  Truck,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import api from "../services/api";

const steps = ["confirmed", "processing", "shipped", "delivered"];

const statusStyles = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

const formatStatus = (status = "") => {
  const normalized = String(status).replace(/[_-]/g, " ").trim();
  if (!normalized) return "Pending";

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const formatPrice = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const getAddress = (address = {}) =>
  [
    address.fullName,
    address.address,
    address.addressLine1,
    address.addressLine2,
    address.landmark,
    address.city,
    address.district,
    address.state,
    address.postalCode || address.pincode || address.zipCode,
  ]
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index)
    .join(", ");

const getOrderStatus = (order) =>
  String(order.orderStatus || order.status || "pending").toLowerCase();

const getPaymentStatus = (order) =>
  String(order.paymentStatus || "pending").toLowerCase();

const getOrderTotal = (order) =>
  order.totalAmount ?? order.totalPrice ?? order.grandTotal ?? 0;

const getItemTotal = (item) => {
  const quantity = Number(item.quantity) || 0;
  const price = Number(item.price ?? item.sellingPrice ?? 0);

  return price * quantity;
};

function StatusBadge({ status, payment = false }) {
  const normalized = String(status || "pending").toLowerCase();

  const paymentClass =
    normalized === "paid" || normalized === "completed"
      ? "bg-emerald-100 text-emerald-800"
      : normalized === "failed"
        ? "bg-red-100 text-red-800"
        : normalized === "refunded"
          ? "bg-slate-200 text-slate-700"
          : "bg-amber-100 text-amber-800";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
        payment
          ? paymentClass
          : statusStyles[normalized] || "bg-slate-100 text-slate-700"
      }`}
    >
      {payment ? "Payment: " : ""}
      {formatStatus(normalized)}
    </span>
  );
}

function DeliveryTimeline({ status }) {
  const currentStep = steps.indexOf(status);

  if (status === "cancelled") {
    return (
      <div className="mx-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 sm:mx-6">
        <p className="font-bold">Order cancelled</p>
        <p className="mt-1">
          This order has been cancelled. If payment was completed, check its
          refund status or contact the shop.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 sm:px-6">
      <div className="flex items-start">
        {steps.map((step, index) => {
          const complete =
            status === "delivered" ||
            (currentStep >= 0 && index <= currentStep);

          return (
            <div key={step} className="relative flex-1 text-center">
              {index > 0 && (
                <div
                  className={`absolute right-1/2 top-4 h-1 w-full ${
                    complete ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
              )}

              <div
                className={`relative z-10 mx-auto flex h-8 w-8 items-center justify-center rounded-full ${
                  complete
                    ? "bg-emerald-500 text-white"
                    : "border-2 border-slate-200 bg-white text-slate-400"
                }`}
              >
                {complete ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </div>

              <p
                className={`mt-2 text-[10px] font-medium sm:text-xs ${
                  complete ? "text-emerald-700" : "text-slate-500"
                }`}
              >
                {formatStatus(step)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MyOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalOrders: 0,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadOrders = useCallback(
    async (refresh = false) => {
      setError("");

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await api.get("/orders/my", {
          params: {
            page: pagination.page,
            limit: pagination.limit,
          },
        });

        const data = response.data;

        if (data?.success === false) {
          throw new Error(data.message || "Orders could not be loaded.");
        }

        const orderList = Array.isArray(data?.orders)
          ? data.orders
          : Array.isArray(data?.data?.orders)
            ? data.data.orders
            : Array.isArray(data?.data)
              ? data.data
              : [];

        const pageData = data?.pagination || data?.data?.pagination || {};

        setOrders(orderList);

        setPagination((previous) => ({
          ...previous,
          page: Number(pageData.page ?? pagination.page),
          limit: Number(pageData.limit ?? previous.limit),
          totalOrders: Number(
            pageData.totalOrders ?? pageData.total ?? orderList.length
          ),
          totalPages: Number(
            pageData.totalPages ??
              Math.ceil(
                Number(pageData.totalOrders ?? pageData.total ?? orderList.length) /
                  Number(pageData.limit ?? previous.limit)
              )
          ),
        }));
      } catch (err) {
        const statusCode = err?.response?.status;

        if (statusCode === 401 || statusCode === 403) {
          setError("Please log in to view your orders.");
        } else {
          setError(
            err?.response?.data?.message ||
              err.message ||
              "Orders could not be loaded. Please check your connection and try again."
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pagination.page, pagination.limit]
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleRefresh = () => {
    loadOrders(true);
  };

  const changePage = (nextPage) => {
    setPagination((previous) => ({
      ...previous,
      page: nextPage,
    }));
  };

  const totalPages = Math.max(0, pagination.totalPages);
  const totalOrders = pagination.totalOrders;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Page heading */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-600">
              Vishal Electricals
            </p>

            <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
              My Orders
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              View your purchases, payment information and delivery progress.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh Orders
          </button>
        </header>

        {/* Summary cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
              <ShoppingBag size={24} />
            </div>

            <div>
              <p className="text-sm text-slate-500">Total Orders</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {totalOrders}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
              <Truck size={24} />
            </div>

            <div>
              <p className="text-sm text-slate-500">Current Page</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {pagination.page} / {Math.max(1, totalPages)}
              </p>
            </div>
          </div>
        </section>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={20} className="mt-0.5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p>{error}</p>

              {error.toLowerCase().includes("log in") ||
              error.toLowerCase().includes("login") ? (
                <button
                  type="button"
                  onClick={() =>
                    navigate("/login", {
                      state: { from: "/my-orders" },
                    })
                  }
                  className="mt-2 font-bold underline"
                >
                  Go to Login
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="mt-2 font-bold underline"
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-slate-500">
            <RefreshCw size={22} className="animate-spin" />
            Loading your orders...
          </div>
        ) : orders.length === 0 && !error ? (
          /* Empty state */
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <Package size={30} />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              No orders yet
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Your purchases will appear here after you place your first order.
            </p>

            <Link
              to="/shop"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-amber-600"
            >
              <ShoppingBag size={17} />
              Shop Now
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          /* Orders list */
          <section className="space-y-5">
            {orders.map((order) => {
              const orderStatus = getOrderStatus(order);
              const paymentStatus = getPaymentStatus(order);
              const shippingAddress = order.shippingAddress || {};
              const addressText = getAddress(shippingAddress);
              const items = Array.isArray(order.items) ? order.items : [];

              return (
                <article
                  key={order._id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  {/* Order header */}
                  <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Order Number
                      </p>

                      <h2 className="mt-1 break-all font-bold text-slate-900">
                        {order.orderNumber || order._id}
                      </h2>

                      <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                        <CalendarDays size={16} />
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={orderStatus} />
                      <StatusBadge status={paymentStatus} payment />
                    </div>
                  </div>

                  {/* Delivery progress */}
                  <DeliveryTimeline status={orderStatus} />

                  {/* Products */}
                  <div className="space-y-4 p-5 sm:p-6">
                    <h3 className="flex items-center gap-2 font-bold text-slate-800">
                      <Package size={18} className="text-amber-600" />
                      Ordered Products ({items.length})
                    </h3>

                    {items.length > 0 ? (
                      <div className="space-y-3">
                        {items.map((item, index) => (
                          <div
                            key={item._id || item.product?._id || item.product || index}
                            className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:p-4"
                          >
                            <div className="min-w-0">
                              <p className="break-words text-sm font-semibold text-slate-800">
                                {item.name ||
                                  item.title ||
                                  item.product?.name ||
                                  "Product"}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {formatPrice(item.price ?? item.sellingPrice ?? 0)}
                                {" "}× {Number(item.quantity) || 0}
                              </p>
                            </div>

                            <p className="shrink-0 text-sm font-bold text-slate-900">
                              {formatPrice(getItemTotal(item))}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                        Product details are not available for this order.
                      </p>
                    )}

                    {/* Address and payment */}
                    <div className="grid grid-cols-1 gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2">
                      <div>
                        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                          <MapPin size={15} />
                          Delivery Address
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {addressText || "Address details not available"}
                        </p>

                        {shippingAddress.phone && (
                          <p className="mt-1 text-sm text-slate-500">
                            Phone: {shippingAddress.phone}
                          </p>
                        )}
                      </div>

                      <div className="rounded-xl bg-amber-50 p-4 sm:text-right">
                        <p className="flex items-center gap-2 text-sm text-slate-600 sm:justify-end">
                          <CreditCard size={16} />
                          {formatStatus(order.paymentMethod || "Not specified")}
                        </p>

                        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Total Amount
                        </p>

                        <p className="mt-1 text-2xl font-extrabold text-amber-700">
                          {formatPrice(getOrderTotal(order))}
                        </p>

                        <p className="mt-2 flex items-center gap-1 text-xs text-slate-500 sm:justify-end">
                          <Clock3 size={13} />
                          Placed on {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            {/* Pagination */}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing page {pagination.page} of {Math.max(1, totalPages)}
                {totalOrders > 0 ? ` · ${totalOrders} orders` : ""}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1 || loading || refreshing}
                  onClick={() => changePage(pagination.page - 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    pagination.page >= totalPages ||
                    totalPages === 0 ||
                    loading ||
                    refreshing
                  }
                  onClick={() => changePage(pagination.page + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
