
import { Link, useLocation } from "react-router-dom";
import {
  CheckCircle2,
  Package,
  MapPin,
  ShoppingBag,
  ArrowRight,
  House,
  Truck,
  ShieldCheck,
  ClipboardCheck,
} from "lucide-react";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(price) || 0);

const getProductImage = (item) => {
  if (item?.image) return item.image;
  if (item?.images?.[0]?.url) return item.images[0].url;
  if (item?.product?.images?.[0]?.url) {
    return item.product.images[0].url;
  }
  return "";
};

export default function OrderSuccess() {
  const { state } = useLocation();
  const order = state?.order;

  if (!order?._id) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <Package className="h-8 w-8 text-amber-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Order details unavailable
          </h1>

          <p className="mt-3 leading-7 text-slate-600">
            We could not find the order details in this page session.
            If you have just placed an order, please keep your order
            confirmation details. Refreshing or opening this page directly
            may remove the temporary order information.
          </p>

          <Link
            to="/"
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            <House className="h-5 w-5" />
            Go to Home
          </Link>
        </div>
      </main>
    );
  }

  const items = order.items || [];
  const address = order.shippingAddress || {};
  const orderNumber = order.orderNumber || order._id;
  const total = Number(order.totalAmount) || 0;
  const subtotal = Number(order.subtotal) || 0;
  const deliveryCharge = Number(order.deliveryCharge) || 0;

  const paymentMethod =
    order.paymentMethod === "cod"
      ? "Cash on Delivery"
      : order.paymentMethod === "online"
        ? "Online Payment"
        : order.paymentMethod || "Not specified";

  const orderStatus = order.orderStatus || "confirmed";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-4xl">
        {/* Success header */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 px-6 py-10 text-center text-white sm:px-12 sm:py-12">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 ring-8 ring-white/10">
              <CheckCircle2 className="h-12 w-12" />
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50">
              Vishal Electricals
            </p>

            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Order Placed Successfully!
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-emerald-50 sm:text-base">
              Thank you for shopping with us. Your order has been
              received, and we will prepare it for delivery.
            </p>
          </div>

          <div className="p-5 sm:p-8">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">Order number</p>
                <p className="mt-1 break-all text-lg font-bold text-slate-900">
                  {orderNumber}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold capitalize text-emerald-700 sm:self-center">
                <ClipboardCheck className="h-4 w-4" />
                {String(orderStatus).replace(/_/g, " ")}
              </div>
            </div>

            {/* Order items */}
            <section className="mt-8">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
                Order Summary
              </h2>

              {items.length > 0 ? (
                <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200">
                  {items.map((item, index) => {
                    const imageUrl = getProductImage(item);
                    const quantity = Number(item.quantity) || 1;
                    const price = Number(item.price) || 0;
                    const lineTotal =
                      Number(item.lineTotal) || price * quantity;

                    return (
                      <div
                        key={item._id || item.product || index}
                        className="flex gap-4 p-4 sm:p-5"
                      >
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.name || "Product"}
                              className="h-full w-full object-contain p-2"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-slate-400" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900">
                            {item.name || "Product"}
                          </h3>

                          {item.sku && (
                            <p className="mt-1 text-xs text-slate-500">
                              SKU: {item.sku}
                            </p>
                          )}

                          <p className="mt-2 text-sm text-slate-600">
                            {formatPrice(price)} × {quantity}
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-bold text-slate-900">
                          {formatPrice(lineTotal)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 rounded-xl bg-slate-100 p-4 text-sm text-slate-600">
                  Individual product details are not available here.
                </p>
              )}
            </section>

            {/* Price details */}
            <section className="mt-6 rounded-2xl border border-slate-200 p-5">
              <h2 className="font-bold text-slate-900">Price Details</h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4 text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between gap-4 text-slate-600">
                  <span>Delivery charge</span>
                  <span>
                    {deliveryCharge === 0
                      ? "Free"
                      : formatPrice(deliveryCharge)}
                  </span>
                </div>

                <div className="border-t border-dashed border-slate-200 pt-4">
                  <div className="flex justify-between gap-4 text-base font-extrabold text-slate-900">
                    <span>Total Amount</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-xl bg-blue-50 p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <p className="font-semibold text-slate-900">
                    Payment Method
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {paymentMethod}
                  </p>
                  {order.paymentMethod === "cod" && (
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Please pay when your order is delivered.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Delivery address */}
            <section className="mt-8">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <MapPin className="h-5 w-5 text-blue-600" />
                Delivery Address
              </h2>

              <div className="mt-4 rounded-2xl border border-slate-200 p-5">
                <p className="font-bold text-slate-900">
                  {address.fullName || "Customer"}
                </p>

                {address.phone && (
                  <p className="mt-2 text-sm text-slate-600">
                    Phone: {address.phone}
                  </p>
                )}

                {address.email && (
                  <p className="mt-1 break-all text-sm text-slate-600">
                    Email: {address.email}
                  </p>
                )}

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {[address.address, address.city, address.state, address.pincode]
                    .filter(Boolean)
                    .join(", ") || "Address details unavailable"}
                </p>
              </div>
            </section>

            {/* Next steps */}
            <div className="mt-8 flex items-start gap-3 rounded-2xl bg-emerald-50 p-5">
              <Truck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
              <div>
                <h3 className="font-bold text-emerald-900">
                  What happens next?
                </h3>
                <p className="mt-1 text-sm leading-6 text-emerald-800">
                  We will process your order and prepare it for delivery.
                  Please keep your order number for future reference.
                </p>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <House className="h-5 w-5" />
                Go to Home
              </Link>

              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Continue Shopping
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-slate-500">
          Thank you for choosing Vishal Electricals.
        </p>
      </div>
    </main>
  );
}
