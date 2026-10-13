
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Wallet,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import api from "../services/api";
import { useCart } from "../context/CartContext";

const initialForm = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "Madhya Pradesh",
  pincode: "",
};

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

// COD delivery charges based on cart subtotal.
const getCodDeliveryCharge = (amount) => {
  const subtotal = Number(amount) || 0;

  if (subtotal < 50) return 20;
  if (subtotal < 100) return 15;
  if (subtotal < 500) return 10;

  return 5;
};

function getProductImage(product) {
  const firstImage = product?.images?.[0];

  if (typeof firstImage === "string") return firstImage;
  if (firstImage?.url) return firstImage.url;

  return product?.image || product?.imageUrl || "";
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const scriptUrl =
      "https://checkout.razorpay.com/v1/checkout.js";

    const existingScript = document.querySelector(
      `script[src="${scriptUrl}"]`
    );

    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        resolve(Boolean(window.Razorpay));
        return;
      }

      existingScript.addEventListener(
        "load",
        () => resolve(Boolean(window.Razorpay)),
        { once: true }
      );

      existingScript.addEventListener(
        "error",
        () => resolve(false),
        { once: true }
      );

      return;
    }

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;

    script.onload = () => {
      script.dataset.loaded = "true";
      resolve(Boolean(window.Razorpay));
    };

    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const navigate = useNavigate();

  const { cartItems, cartCount, cartTotal, clearCart } = useCart();

  const [form, setForm] = useState(initialForm);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [submitting, setSubmitting] = useState(false);

  // COD gets a slab-based delivery charge.
  // Online payment has free delivery.
  const deliveryCharge =
    paymentMethod === "cod"
      ? getCodDeliveryCharge(cartTotal)
      : 0;

  const grandTotal =
    (Number(cartTotal) || 0) + deliveryCharge;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const getCheckoutData = () => {
    if (!cartItems.length) {
      throw new Error("Your cart is empty.");
    }

    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      throw new Error("Enter a valid 10-digit mobile number.");
    }

    if (!/^\d{6}$/.test(form.pincode.trim())) {
      throw new Error("Enter a valid 6-digit PIN code.");
    }

    if (
      !form.fullName.trim() ||
      !form.address.trim() ||
      !form.city.trim() ||
      !form.state.trim()
    ) {
      throw new Error(
        "Please complete all required delivery details."
      );
    }

    return {
      items: cartItems.map(({ product, quantity }) => ({
        productId: product._id,
        quantity,
      })),
      shippingAddress: {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
      },
    };
  };

  const finishOrder = (order) => {
    clearCart();

    toast.success(
      order.paymentMethod === "online"
        ? "Payment verified successfully!"
        : "Your order has been placed successfully!"
    );

    navigate(`/order-success/${order._id}`, {
      replace: true,
      state: { order },
    });
  };

  const openRazorpayCheckout = (order, razorpayData) => {
    if (!window.Razorpay) {
      throw new Error(
        "Razorpay Checkout could not be loaded. Please retry."
      );
    }

    if (!razorpayData?.keyId || !razorpayData?.orderId) {
      throw new Error(
        "Razorpay order details are missing. Please check backend configuration."
      );
    }

    const options = {
      key: razorpayData.keyId,
      amount: razorpayData.amount,
      currency: razorpayData.currency || "INR",
      name: "Vishal Electricals",
      description: `Order ${order.orderNumber}`,
      order_id: razorpayData.orderId,

      prefill: {
        name: form.fullName.trim(),
        email: form.email.trim(),
        contact: form.phone.trim(),
      },

      notes: {
        orderNumber: order.orderNumber,
      },

      theme: {
        color: "#f97316",
      },

      handler: async (paymentResponse) => {
        try {
          const verifyResponse = await api.post(
            "/orders/verify-payment",
            {
              orderId: order._id,
              razorpay_order_id:
                paymentResponse.razorpay_order_id,
              razorpay_payment_id:
                paymentResponse.razorpay_payment_id,
              razorpay_signature:
                paymentResponse.razorpay_signature,
            }
          );

          if (
            !verifyResponse.data?.success ||
            verifyResponse.data?.order?.paymentStatus !== "paid"
          ) {
            throw new Error(
              verifyResponse.data?.message ||
                "Payment verification is not complete."
            );
          }

          finishOrder(verifyResponse.data.order);
        } catch (error) {
          console.error("Payment verification error:", error);

          toast.error(
            error.response?.data?.message ||
              error.message ||
              "Payment verification failed. Check the order status before retrying."
          );
        } finally {
          setSubmitting(false);
        }
      },

      modal: {
        ondismiss: () => {
          setSubmitting(false);

          toast.info(
            "Checkout was closed. Your cart is unchanged. If payment was deducted, check its status before trying again."
          );
        },
      },
    };

    const razorpay = new window.Razorpay(options);

    razorpay.on("payment.failed", (response) => {
      setSubmitting(false);

      toast.error(
        response.error?.description ||
          "Payment failed. Your cart has not been cleared."
      );
    });

    razorpay.open();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    // Check login only when the user tries to place an order.
    // Guests can still view the Checkout page.
    try {
      await api.get("/auth/me");
    } catch (authError) {
      if (
        authError.response?.status === 401 ||
        authError.response?.status === 403
      ) {
        toast.error("Please login first");
      } else {
        toast.error(
          "Unable to verify login. Please try again."
        );
      }

      return;
    }

    let keepSubmitting = false;

    try {
      const checkoutData = getCheckoutData();

      setSubmitting(true);

      if (paymentMethod === "online") {
        const loaded = await loadRazorpayScript();

        if (!loaded) {
          throw new Error(
            "Unable to load Razorpay Checkout. Check your internet connection and retry."
          );
        }
      }

      // The backend must independently calculate and validate
      // the final order amount and delivery charge.
      const response = await api.post("/orders", {
        ...checkoutData,
        paymentMethod,
      });

      if (
        !response.data?.success ||
        !response.data?.order?._id
      ) {
        throw new Error(
          response.data?.message ||
            "Order could not be created."
        );
      }

      const order = response.data.order;

      if (
        paymentMethod === "cod" ||
        order.paymentStatus === "paid"
      ) {
        finishOrder(order);
        return;
      }

      openRazorpayCheckout(
        order,
        response.data.razorpay
      );

      keepSubmitting = true;
    } catch (error) {
      console.error("Checkout error:", error);

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        toast.error("Please login first");
        return;
      }

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to continue checkout. Please try again."
      );
    } finally {
      if (!keepSubmitting) {
        setSubmitting(false);
      }
    }
  };

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10";

  const labelClass =
    "block text-sm font-medium text-slate-700";

  if (cartItems.length === 0) {
    return (
      <main className="flex min-h-[65vh] items-center justify-center bg-white px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
            <ShoppingBag
              size={28}
              className="text-orange-600"
            />
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
            Your cart is empty
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Add products to your cart before proceeding to checkout.
          </p>

          <Link
            to="/shop"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Explore Products
            <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/70 pb-12 text-slate-900">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="group flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
              <Zap size={22} fill="currentColor" />
            </span>

            <span>
              <span className="block text-base font-extrabold tracking-tight sm:text-lg">
                Vishal Electricals
              </span>
              <span className="block text-[11px] font-medium tracking-wide text-slate-500">
                QUALITY YOU CAN TRUST
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 sm:text-sm">
            <LockKeyhole
              size={16}
              className="text-emerald-600"
            />
            Secure Checkout
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 sm:text-sm">
          <Link to="/" className="hover:text-orange-600">
            Home
          </Link>
          <span>/</span>
          <Link to="/cart" className="hover:text-orange-600">
            Shopping Cart
          </Link>
          <span>/</span>
          <span className="text-slate-900">Checkout</span>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
              Almost there
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Checkout
            </h1>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Confirm your delivery details and review your order.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full border border-emerald-100 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 sm:self-auto">
            <ShieldCheck size={16} />
            Trusted shopping
          </div>
        </div>

        <div className="mt-6 flex max-w-lg items-center">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white">
              <Check size={14} />
            </span>
            <span className="text-xs font-semibold text-slate-600 sm:text-sm">
              Cart
            </span>
          </div>

          <div className="mx-3 h-px flex-1 bg-slate-300 sm:mx-5" />

          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
              2
            </span>
            <span className="text-xs font-bold text-slate-900 sm:text-sm">
              Delivery
            </span>
          </div>

          <div className="mx-3 h-px flex-1 bg-slate-300 sm:mx-5" />

          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-500">
              3
            </span>
            <span className="text-xs font-medium text-slate-500 sm:text-sm">
              Review
            </span>
          </div>
        </div>

        <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_370px] lg:gap-8">
          <div className="min-w-0 space-y-5">
            <form
              id="checkout-form"
              onSubmit={handleSubmit}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]"
            >
              <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <MapPin size={20} />
                </span>

                <div>
                  <h2 className="text-lg font-bold tracking-tight">
                    Delivery address
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Where should we deliver your order?
                  </p>
                </div>
              </div>

              <div className="grid gap-x-5 gap-y-4 px-5 py-6 sm:grid-cols-2 sm:px-7">
                <label className={labelClass}>
                  Full name <span className="text-red-500">*</span>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    maxLength={100}
                    required
                  />
                </label>

                <label className={labelClass}>
                  Mobile number{" "}
                  <span className="text-red-500">*</span>
                  <input
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    value={form.phone}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="10-digit mobile number"
                    autoComplete="tel"
                    pattern="[6-9][0-9]{9}"
                    maxLength={10}
                    required
                  />
                </label>

                <label className={`${labelClass} sm:col-span-2`}>
                  Email address{" "}
                  <span className="font-normal text-slate-400">
                    (optional)
                  </span>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="you@example.com"
                    autoComplete="email"
                    maxLength={150}
                  />
                </label>

                <label className={`${labelClass} sm:col-span-2`}>
                  House number, street and area{" "}
                  <span className="text-red-500">*</span>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className={`${inputClass} resize-y`}
                    placeholder="House / Flat no., street, landmark..."
                    autoComplete="street-address"
                    rows={3}
                    maxLength={500}
                    required
                  />
                </label>

                <label className={labelClass}>
                  City <span className="text-red-500">*</span>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Your city"
                    autoComplete="address-level2"
                    maxLength={100}
                    required
                  />
                </label>

                <label className={labelClass}>
                  State <span className="text-red-500">*</span>
                  <input
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    className={inputClass}
                    autoComplete="address-level1"
                    maxLength={100}
                    required
                  />
                </label>

                <label className={labelClass}>
                  PIN code <span className="text-red-500">*</span>
                  <input
                    name="pincode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    value={form.pincode}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="6-digit PIN code"
                    autoComplete="postal-code"
                    maxLength={6}
                    required
                  />
                </label>
              </div>

              <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3.5 sm:px-7">
                <p className="flex items-center gap-2 text-xs leading-5 text-slate-500">
                  <LockKeyhole size={14} className="shrink-0" />
                  Your delivery details will be used to process your order.
                </p>
              </div>
            </form>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02] sm:p-7">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Wallet size={20} />
                </span>

                <div>
                  <h2 className="text-lg font-bold tracking-tight">
                    Payment method
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose how you would like to pay.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  aria-pressed={paymentMethod === "cod"}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                    paymentMethod === "cod"
                      ? "border-orange-500 bg-orange-50/50 ring-1 ring-orange-500"
                      : "border-slate-200 hover:border-slate-400"
                  }`}
                >
                  <Truck
                    size={21}
                    className="text-orange-600"
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">
                      Cash on Delivery
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      Pay when your order arrives.
                    </span>
                  </span>

                  {paymentMethod === "cod" && (
                    <CheckCircle2
                      size={18}
                      className="shrink-0 text-orange-600"
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("online")}
                  aria-pressed={paymentMethod === "online"}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                    paymentMethod === "online"
                      ? "border-orange-500 bg-orange-50/50 ring-1 ring-orange-500"
                      : "border-slate-200 hover:border-slate-400"
                  }`}
                >
                  <CreditCard
                    size={21}
                    className="text-slate-500"
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">
                      Online Payment
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      Cards, UPI and other available methods.
                    </span>
                  </span>

                  {paymentMethod === "online" && (
                    <CheckCircle2
                      size={18}
                      className="shrink-0 text-orange-600"
                    />
                  )}
                </button>
              </div>

              <p
                className={`mt-4 rounded-lg px-3.5 py-3 text-xs leading-5 ${
                  paymentMethod === "online"
                    ? "bg-blue-50 text-blue-800"
                    : "bg-orange-50 text-orange-800"
                }`}
              >
                {paymentMethod === "online"
                  ? "Online payment selected. Delivery is free. Razorpay Checkout will open after you place the order."
                  : `Cash on Delivery selected. Delivery charge: ${formatPrice(
                      deliveryCharge
                    )}. Pay the total amount when your order arrives.`}
              </p>
            </section>
          </div>

          <aside className="min-w-0 lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.03]">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
                <h2 className="text-lg font-bold tracking-tight">
                  Order summary
                </h2>

                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                  {cartCount} {cartCount === 1 ? "item" : "items"}
                </span>
              </div>

              <div className="max-h-[360px] space-y-4 overflow-y-auto px-5 py-5">
                {cartItems.map(({ product, quantity }) => {
                  const imageUrl = getProductImage(product);

                  return (
                    <div key={product._id} className="flex gap-3">
                      <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name || "Product"}
                            className="h-full w-full object-contain p-1.5"
                            loading="lazy"
                          />
                        ) : (
                          <Package
                            size={26}
                            className="text-slate-300"
                          />
                        )}
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                        <div>
                          <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-800">
                            {product.name}
                          </p>

                          {product.brand && (
                            <p className="mt-1 text-xs text-slate-500">
                              {product.brand}
                            </p>
                          )}
                        </div>

                        <p className="mt-2 text-xs text-slate-500">
                          Qty: {quantity}
                        </p>
                      </div>

                      <div className="shrink-0 pt-0.5 text-right">
                        <p className="text-sm font-bold">
                          {formatPrice(
                            (Number(product.price) || 0) * quantity
                          )}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                          {formatPrice(product.price)} each
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 px-5 py-5">
                <Link
                  to="/cart"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
                >
                  <ArrowLeft size={15} />
                  Edit cart
                </Link>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-3 text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-slate-900">
                      {formatPrice(cartTotal)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 text-slate-600">
                    <span>
                      Delivery
                      {paymentMethod === "cod" && (
                        <span className="ml-1 text-xs text-slate-400">
                          (COD)
                        </span>
                      )}
                    </span>

                    <span
                      className={`font-semibold ${
                        deliveryCharge === 0
                          ? "text-emerald-700"
                          : "text-slate-900"
                      }`}
                    >
                      {deliveryCharge === 0
                        ? "Free"
                        : formatPrice(deliveryCharge)}
                    </span>
                  </div>
                </div>

                <div className="my-5 border-t border-dashed border-slate-200" />

                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">
                      Total amount
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {paymentMethod === "cod"
                        ? "Includes COD delivery charge"
                        : "Includes free delivery"}
                    </p>
                  </div>

                  <p className="text-2xl font-extrabold tracking-tight">
                    {formatPrice(grandTotal)}
                  </p>
                </div>

                <button
                  type="submit"
                  form="checkout-form"
                  disabled={submitting}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? paymentMethod === "online"
                      ? "Processing payment..."
                      : "Placing order..."
                    : paymentMethod === "online"
                      ? "Pay securely"
                      : "Place COD Order"}

                  <ArrowRight size={17} />
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <LockKeyhole size={14} />
                  Safe and secure checkout
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <ShieldCheck
                  size={19}
                  className="text-emerald-700"
                />

                <p className="mt-2 text-xs font-bold text-slate-800">
                  Quality products
                </p>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  Shop with confidence
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <Truck
                  size={19}
                  className="text-orange-600"
                />

                <p className="mt-2 text-xs font-bold text-slate-800">
                  Delivery support
                </p>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  Delivery details confirmed
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-9 border-t border-slate-200 pt-5 text-center">
          <p className="text-xs leading-5 text-slate-500">
            © {new Date().getFullYear()} Vishal Electricals. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
