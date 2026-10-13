
import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "vishal-electricals-cart";

function readCart() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(readCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error("Cart save error:", error);
    }
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    if (!product?._id) return;

    const amount = Math.max(1, Math.floor(Number(quantity) || 1));

    setCartItems((current) => {
      const existing = current.find(
        (item) => item.product._id === product._id
      );

      if (existing) {
        return current.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + amount }
            : item
        );
      }

      return [...current, { product, quantity: amount }];
    });
  };

  const updateQuantity = (productId, quantity) => {
    const amount = Math.floor(Number(quantity));

    if (!Number.isFinite(amount) || amount < 1) {
      removeFromCart(productId);
      return;
    }

    setCartItems((current) =>
      current.map((item) =>
        item.product._id === productId
          ? { ...item, quantity: amount }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((current) =>
      current.filter((item) => item.product._id !== productId)
    );
  };

  const clearCart = () => setCartItems([]);

  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cartItems.reduce(
    (total, item) =>
      total + (Number(item.product.price) || 0) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
