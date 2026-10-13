import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "../context/CartContext";

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function getImage(product) {
  const first = product?.images?.[0];

  if (typeof first === "string") return first;

  return first?.url || product?.image || product?.imageUrl || "";
}

export default function Cart() {
  const {
    cartItems,
    cartCount,
    cartTotal,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  if (cartItems.length === 0) {
    return (
      <main className="flex min-h-[65vh] items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <ShoppingBag size={30} />
          </div>

          <h1 className="mt-5 text-2xl font-extrabold text-slate-900">
            Your Cart Is Empty
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Apne pasand ke electrical products shop se add karo.
          </p>

          <Link
            to="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
          >
            <ArrowLeft size={17} />
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={17} />
          Continue Shopping
        </Link>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Shopping Cart
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {cartCount} {cartCount === 1 ? "item" : "items"} in your cart
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              clearCart();
              toast.success("Cart clear ho gaya.");
            }}
            className="text-sm font-semibold text-red-600 hover:text-red-800"
          >
            Clear Cart
          </button>
        </div>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-4">
            {cartItems.map(({ product, quantity }) => {
              const image = getImage(product);

              return (
                <article
                  key={product._id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
                >
                  <Link
                    to={`/product/${encodeURIComponent(
                      product.slug || product._id,
                    )}`}
                    className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 sm:w-28"
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={product.name}
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <Package size={35} className="text-slate-300" />
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/product/${encodeURIComponent(
                        product.slug || product._id,
                      )}`}
                      className="font-bold text-slate-900 hover:text-blue-600"
                    >
                      {product.name}
                    </Link>

                    <p className="mt-1 text-sm text-slate-500">
                      {product.category || "Electrical Products"}
                    </p>

                    <p className="mt-3 font-bold text-slate-900">
                      {formatPrice(product.price)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <div className="flex items-center rounded-lg border border-slate-200">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        disabled={quantity <= 1}
                        onClick={() =>
                          updateQuantity(product._id, quantity - 1)
                        }
                        className="p-2.5 disabled:opacity-40"
                      >
                        <Minus size={15} />
                      </button>

                      <span className="min-w-9 text-center text-sm font-bold">
                        {quantity}
                      </span>

                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() =>
                          updateQuantity(product._id, quantity + 1)
                        }
                        className="p-2.5"
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    <p className="font-extrabold text-slate-900">
                      {formatPrice(Number(product.price) * quantity)}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        removeFromCart(product._id);
                        toast.success("Product cart se remove ho gaya.");
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={15} />
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-lg font-extrabold text-slate-900">
              Order Summary
            </h2>

            <div className="mt-5 flex justify-between gap-4 text-sm text-slate-600">
              <span>Items ({cartCount})</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>

            <div className="mt-3 flex justify-between gap-4 text-sm text-slate-600">
              <span>Delivery</span>
              <span>Calculated at checkout</span>
            </div>

            <div className="my-5 border-t border-slate-200" />

            <div className="flex justify-between gap-4">
              <span className="font-bold text-slate-900">Subtotal</span>
              <span className="text-xl font-black text-slate-900">
                {formatPrice(cartTotal)}
              </span>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Final delivery charges and payable total will be confirmed during
              checkout.
            </p>

            <Link
              to="/checkout"
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white transition hover:bg-blue-700"
            >
              Proceed to Checkout
            </Link>

            <Link
              to="/shop"
              className="mt-3 flex w-full items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Continue Shopping
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
