
import { useCallback, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  X,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

import api from "../../services/api";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

const formatStatus = (status = "") =>
  status.charAt(0).toUpperCase() + status.slice(1);

const formatPrice = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getCustomer = (order) => {
  const address = order.shippingAddress || {};
  const user = order.user || {};

  return {
    name: address.name || user.name || "Customer",
    email: address.email || user.email || "—",
    phone: address.phone || "—",
  };
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalOrders: 0,
    totalPages: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchOrders = useCallback(
    async (showRefresh = false) => {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await api.get("/admin/orders", {
          params: {
            page: pagination.page,
            limit: pagination.limit,
            ...(search ? { search } : {}),
            ...(statusFilter ? { status: statusFilter } : {}),
            ...(paymentFilter
              ? { paymentStatus: paymentFilter }
              : {}),
            ...(methodFilter ? { paymentMethod: methodFilter } : {}),
          },
        });

        const data = response.data;

        if (!data.success) {
          throw new Error(data.message || "Orders load nahi hue");
        }

        setOrders(data.orders || []);
        setCounts(data.counts || {});

        setPagination((previous) => ({
          ...previous,
          ...(data.pagination || {}),
        }));
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Orders load nahi ho paaye. Backend check karo."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      pagination.page,
      pagination.limit,
      search,
      statusFilter,
      paymentFilter,
      methodFilter,
    ]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const applySearch = (event) => {
    event.preventDefault();
    setPagination((previous) => ({ ...previous, page: 1 }));
    setSearch(searchInput.trim());
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatusFilter("");
    setPaymentFilter("");
    setMethodFilter("");
    setPagination((previous) => ({ ...previous, page: 1 }));
  };

  const updateOrderStatus = async (order, nextStatus) => {
    if (!nextStatus || nextStatus === order.orderStatus) return;

    const confirmed = window.confirm(
      `Order ${order.orderNumber || order._id} ka status "${formatStatus(
        nextStatus
      )}" karna hai?`
    );

    if (!confirmed) return;

    setUpdatingId(order._id);
    setError("");
    setNotice("");

    try {
      const response = await api.patch(
        `/admin/orders/${order._id}/status`,
        { orderStatus: nextStatus }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Status update fail hua");
      }

      setNotice("Order status successfully update ho gaya.");

      await fetchOrders(true);

      if (selectedOrder?._id === order._id) {
        try {
          const details = await api.get(`/admin/orders/${order._id}`);
          setSelectedOrder(details.data.order || null);
        } catch {
          setSelectedOrder(response.data.order || null);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Order status update nahi ho paaya."
      );
    } finally {
      setUpdatingId("");
    }
  };

  const viewOrder = async (order) => {
    setSelectedOrder(order);
    setError("");

    try {
      const response = await api.get(`/admin/orders/${order._id}`);
      setSelectedOrder(response.data.order || order);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Order details load nahi hui. List mein available details dekh sakte ho."
      );
    }
  };

  const statCards = [
    {
      label: "Total Orders",
      value: Object.values(counts).reduce(
        (sum, value) => sum + Number(value || 0),
        0
      ),
      icon: Package,
      color: "bg-slate-100 text-slate-700",
    },
    {
      label: "Pending",
      value: counts.pending || 0,
      icon: Clock,
      color: "bg-amber-100 text-amber-700",
    },
    {
      label: "Processing",
      value: counts.processing || 0,
      icon: RefreshCw,
      color: "bg-indigo-100 text-indigo-700",
    },
    {
      label: "Delivered",
      value: counts.delivered || 0,
      icon: CheckCircle,
      color: "bg-emerald-100 text-emerald-700",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page heading */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-rose-600">
              Vishal Electricals · Admin
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Order Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Customer orders, payments aur delivery status manage karo.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchOrders(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh Orders
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {notice && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {notice}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    {card.label}
                  </p>
                  <span className={`rounded-xl p-3 ${card.color}`}>
                    <Icon size={21} />
                  </span>
                </div>

                <p className="mt-4 text-3xl font-bold text-slate-900">
                  {card.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <form
            onSubmit={applySearch}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            <div className="relative lg:col-span-2">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Order no., customer, phone..."
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPagination((previous) => ({ ...previous, page: 1 }));
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-rose-400"
            >
              <option value="">All Order Statuses</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(event) => {
                setPaymentFilter(event.target.value);
                setPagination((previous) => ({ ...previous, page: 1 }));
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-rose-400"
            >
              <option value="">All Payment Statuses</option>
              {["pending", "paid", "failed", "refunded"].map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>

            <select
              value={methodFilter}
              onChange={(event) => {
                setMethodFilter(event.target.value);
                setPagination((previous) => ({ ...previous, page: 1 }));
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-rose-400"
            >
              <option value="">All Payment Methods</option>
              <option value="cod">Cash on Delivery</option>
              <option value="online">Online Payment</option>
            </select>

            <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-5">
              <button
                type="submit"
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Search Orders
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Clear Filters
              </button>
            </div>
          </form>
        </div>

        {/* Orders table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-900">All Orders</h2>
              <p className="mt-1 text-xs text-slate-500">
                {pagination.totalOrders} order(s) found
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-56 items-center justify-center gap-3 text-slate-500">
              <RefreshCw className="animate-spin" size={20} />
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
              <Package size={42} className="text-slate-300" />
              <h3 className="mt-4 font-semibold text-slate-800">
                No orders found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Filters clear karke dobara try karo.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Order</th>
                      <th className="px-5 py-4">Customer</th>
                      <th className="px-5 py-4">Date</th>
                      <th className="px-5 py-4">Amount</th>
                      <th className="px-5 py-4">Payment</th>
                      <th className="px-5 py-4">Order Status</th>
                      <th className="px-5 py-4">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {orders.map((order) => {
                      const customer = getCustomer(order);

                      return (
                        <tr key={order._id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-900">
                              {order.orderNumber || order._id}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {order.items?.length || 0} item(s)
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-800">
                              {customer.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {customer.phone}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                            {formatDate(order.createdAt)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900">
                            {formatPrice(order.totalAmount)}
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-700">
                              {String(order.paymentMethod || "—").toUpperCase()}
                            </p>
                            <span
                              className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                                order.paymentStatus === "paid"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : order.paymentStatus === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {formatStatus(order.paymentStatus || "pending")}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <select
                              value={order.orderStatus}
                              disabled={
                                updatingId === order._id ||
                                order.orderStatus === "cancelled" ||
                                order.orderStatus === "delivered"
                              }
                              onChange={(event) =>
                                updateOrderStatus(order, event.target.value)
                              }
                              className={`max-w-40 rounded-full border-0 px-3 py-2 text-xs font-semibold outline-none disabled:cursor-not-allowed disabled:opacity-70 ${
                                STATUS_STYLES[order.orderStatus] ||
                                "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {ORDER_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {formatStatus(status)}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => viewOrder(order)}
                              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                            >
                              <Eye size={16} />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Page {pagination.page} of{" "}
                  {Math.max(1, pagination.totalPages)}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() =>
                      setPagination((previous) => ({
                        ...previous,
                        page: previous.page - 1,
                      }))
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      pagination.page >= pagination.totalPages ||
                      pagination.totalPages === 0
                    }
                    onClick={() =>
                      setPagination((previous) => ({
                        ...previous,
                        page: previous.page + 1,
                      }))
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium disabled:opacity-40"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Order details modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedOrder(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Order details"
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Order Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedOrder.orderNumber || selectedOrder._id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close order details"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={21} />
              </button>
            </div>

            <div className="space-y-6 p-5">
              {(() => {
                const customer = getCustomer(selectedOrder);
                const address = selectedOrder.shippingAddress || {};

                return (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase text-slate-500">
                          Customer
                        </p>
                        <p className="mt-2 font-bold text-slate-900">
                          {customer.name}
                        </p>
                        <p className="mt-1 break-all text-sm text-slate-600">
                          {customer.email}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {customer.phone}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase text-slate-500">
                          Payment
                        </p>
                        <p className="mt-2 font-bold text-slate-900">
                          {formatPrice(selectedOrder.totalAmount)}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Method:{" "}
                          {String(
                            selectedOrder.paymentMethod || "—"
                          ).toUpperCase()}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Status:{" "}
                          {formatStatus(selectedOrder.paymentStatus || "pending")}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 font-bold text-slate-900">
                        <Truck className="mr-2 inline" size={18} />
                        Delivery Address
                      </h3>

                      <div className="rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-600">
                        {[
                          address.address,
                          address.addressLine1,
                          address.addressLine2,
                          address.city,
                          address.state,
                          address.postalCode || address.pincode,
                          address.country,
                        ]
                          .filter(Boolean)
                          .join(", ") || "Address details available nahi hain."}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 font-bold text-slate-900">
                        <Package className="mr-2 inline" size={18} />
                        Ordered Items
                      </h3>

                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full min-w-[420px] text-sm">
                          <thead className="bg-slate-50 text-left text-slate-500">
                            <tr>
                              <th className="px-4 py-3">Product</th>
                              <th className="px-4 py-3">Qty</th>
                              <th className="px-4 py-3">Price</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">
                            {(selectedOrder.items || []).map((item, index) => (
                              <tr key={item._id || item.product || index}>
                                <td className="px-4 py-3 font-medium text-slate-800">
                                  {item.name || item.title || "Product"}
                                </td>
                                <td className="px-4 py-3">
                                  {item.quantity || 0}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">
                                  {formatPrice(
                                    (Number(item.price) || 0) *
                                      (Number(item.quantity) || 0)
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-rose-50 p-4">
                      <div>
                        <p className="text-sm text-slate-600">
                          Order Status
                        </p>
                        <p className="mt-1 font-bold text-rose-700">
                          {formatStatus(selectedOrder.orderStatus)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-slate-500">
                          Order placed
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatDate(selectedOrder.createdAt)}
                        </p>
                      </div>
                    </div>

                    {selectedOrder.orderStatus !== "cancelled" &&
                      selectedOrder.orderStatus !== "delivered" && (
                        <div>
                          <label
                            htmlFor="modal-order-status"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                          >
                            Update Order Status
                          </label>

                          <select
                            id="modal-order-status"
                            value={selectedOrder.orderStatus}
                            disabled={updatingId === selectedOrder._id}
                            onChange={(event) =>
                              updateOrderStatus(
                                selectedOrder,
                                event.target.value
                              )
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400"
                          >
                            {ORDER_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {formatStatus(status)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                    {selectedOrder.paymentStatus === "paid" && (
                      <p className="flex gap-2 text-sm text-emerald-700">
                        <CreditCard size={18} />
                        Payment verified. Paid orders ko cancel karne se pehle
                        refund process karna zaroori hai.
                      </p>
                    )}

                    {selectedOrder.orderStatus === "cancelled" && (
                      <p className="flex gap-2 text-sm text-red-700">
                        <XCircle size={18} />
                        Ye order cancel ho chuka hai.
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
