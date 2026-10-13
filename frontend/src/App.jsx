
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";

import Register from "./pages/Register";
import Login from "./pages/Login";
import MyOrders from "./pages/MyOrders";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AddProduct from "./pages/admin/AddProduct";
import ManageProducts from "./pages/admin/ManageProducts";
import AdminOrders from "./pages/admin/AdminOrders";

import { CartProvider } from "./context/CartContext";

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <div className="flex min-h-screen flex-col">
          <Header />

          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={4000}
          />

          <main className="flex-1">
            <Routes>
              {/* Customer Pages */}
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetails />} />

              {/* Cart and Checkout */}
              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success/:id" element={<OrderSuccess />} />

              {/* Authentication */}
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />

              {/* Customer Orders */}
              <Route path="/my-orders" element={<MyOrders />} />

              {/* Admin Pages */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/products/new" element={<AddProduct />} />
              <Route path="/admin/products" element={<ManageProducts />} />
              <Route path="/admin/orders" element={<AdminOrders />} />

              {/* Unknown URL */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </CartProvider>
    </BrowserRouter>
  );
}
