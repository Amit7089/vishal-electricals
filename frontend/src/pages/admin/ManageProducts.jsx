
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Save,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../services/api";

const emptyEditForm = {
  name: "",
  sku: "",
  category: "",
  brand: "",
  price: "",
  compareAtPrice: "",
  stock: "",
  shortDescription: "",
  description: "",
  imageUrl: "",
  isFeatured: false,
  isBestSeller: false,
};

export default function ManageProducts() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const response = await api.get("/products?limit=100&sort=newest");

      if (response.data.success) {
        setProducts(response.data.products || []);
      } else {
        setError(response.data.message || "Products load nahi ho sake.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Products load nahi hue. Backend connection check karo."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = products.filter((product) => {
    const term = search.trim().toLowerCase();

    if (!term) return true;

    return [
      product.name,
      product.sku,
      product.category,
      product.brand,
    ].some((value) => String(value || "").toLowerCase().includes(term));
  });

  const openEdit = (product) => {
    setEditingProduct(product);

    setEditForm({
      name: product.name || "",
      sku: product.sku || "",
      category: product.category || "",
      brand: product.brand || "",
      price: product.price ?? "",
      compareAtPrice: product.compareAtPrice ?? "",
      stock: product.stock ?? 0,
      shortDescription: product.shortDescription || "",
      description: product.description || "",
      imageUrl: product.images?.[0]?.url || "",
      isFeatured: Boolean(product.isFeatured),
      isBestSeller: Boolean(product.isBestSeller),
    });
  };

  const updateEditField = (name, value) => {
    setEditForm((previous) => ({ ...previous, [name]: value }));
  };

  const saveEdit = async (event) => {
    event.preventDefault();

    if (
      !editForm.name.trim() ||
      !editForm.sku.trim() ||
      !editForm.category.trim()
    ) {
      toast.error("Product name, SKU aur category zaroori hain.");
      return;
    }

    if (editForm.price === "" || Number(editForm.price) < 0) {
      toast.error("Valid price enter karo.");
      return;
    }

    if (
      editForm.compareAtPrice !== "" &&
      Number(editForm.compareAtPrice) < Number(editForm.price)
    ) {
      toast.error("MRP selling price se kam nahi ho sakta.");
      return;
    }

    if (editForm.stock === "" || Number(editForm.stock) < 0) {
      toast.error("Valid stock enter karo.");
      return;
    }

    const existingImages = editingProduct.images || [];
    const newImageUrl = editForm.imageUrl.trim();

    const images = newImageUrl
      ? [
          {
            ...(existingImages[0] || {}),
            url: newImageUrl,
            alt: editForm.name.trim(),
          },
          ...existingImages.slice(1),
        ]
      : [];

    const payload = {
      name: editForm.name.trim(),
      sku: editForm.sku.trim(),
      category: editForm.category.trim(),
      brand: editForm.brand.trim(),
      price: Number(editForm.price),
      compareAtPrice:
        editForm.compareAtPrice === ""
          ? null
          : Number(editForm.compareAtPrice),
      stock: Number(editForm.stock),
      shortDescription: editForm.shortDescription.trim(),
      description: editForm.description.trim(),
      images,
      isFeatured: editForm.isFeatured,
      isBestSeller: editForm.isBestSeller,
    };

    try {
      setSaving(true);

      const response = await api.put(
        `/admin/products/${editingProduct._id}`,
        payload
      );

      if (response.data.success) {
        toast.success("Product update ho gaya.");
        setEditingProduct(null);
        await loadProducts(false);
      } else {
        toast.error(response.data.message || "Product update nahi hua.");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Product update nahi ho saka."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (product) => {
    const confirmed = window.confirm(
      `"${product.name}" ko permanently delete karna hai?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(product._id);

      const response = await api.delete(`/admin/products/${product._id}`);

      if (response.data.success) {
        setProducts((previous) =>
          previous.filter((item) => item._id !== product._id)
        );
        toast.success("Product delete ho gaya.");
      } else {
        toast.error(response.data.message || "Product delete nahi hua.");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Product delete nahi ho saka."
      );
    } finally {
      setDeletingId("");
    }
  };

  const formatPrice = (price) =>
    `₹${Number(price || 0).toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/admin"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-rose-600"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Manage Products
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Apne store ke products, prices aur stock manage karo.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => loadProducts(false)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/products/new")}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
            >
              <Plus size={18} />
              Add Product
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Total Products Loaded</p>
              <Package className="text-rose-600" size={22} />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {products.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">In Stock</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {products.filter((product) => Number(product.stock) > 0).length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Out of Stock</p>
            <p className="mt-2 text-2xl font-bold text-red-600">
              {products.filter((product) => Number(product.stock) <= 0).length}
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
          <div className="relative max-w-lg">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by product, SKU, brand or category..."
              className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
            />
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => loadProducts()}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            <RefreshCw size={28} className="mx-auto mb-3 animate-spin" />
            Products load ho rahe hain...
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                  <tr>
                    <th className="px-5 py-4">Product</th>
                    <th className="px-5 py-4">SKU</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Price</th>
                    <th className="px-5 py-4">Stock</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                            {product.images?.[0]?.url ? (
                              <img
                                src={product.images[0].url}
                                alt={product.images[0].alt || product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon
                                size={22}
                                className="text-slate-400"
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {product.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {product.brand || "No brand"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {product.sku || "—"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {product.category || "—"}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {formatPrice(product.price)}
                        {product.compareAtPrice &&
                          Number(product.compareAtPrice) >
                            Number(product.price) && (
                            <p className="mt-1 text-xs font-normal text-slate-400 line-through">
                              {formatPrice(product.compareAtPrice)}
                            </p>
                          )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={
                            Number(product.stock) > 0
                              ? "font-medium text-emerald-700"
                              : "font-medium text-red-600"
                          }
                        >
                          {product.stock ?? 0}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            product.isActive === false
                              ? "bg-slate-100 text-slate-600"
                              : Number(product.stock) > 0
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                          }`}
                        >
                          {product.isActive === false
                            ? "Inactive"
                            : Number(product.stock) > 0
                              ? "In Stock"
                              : "Out of Stock"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(product)}
                            title="Edit product"
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteProduct(product)}
                            disabled={deletingId === product._id}
                            title="Delete product"
                            className="rounded-lg border border-slate-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId === product._id ? (
                              <RefreshCw size={17} className="animate-spin" />
                            ) : (
                              <Trash2 size={17} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredProducts.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-5 py-14 text-center text-slate-500"
                      >
                        {search
                          ? "Is search se koi product nahi mila."
                          : "Abhi koi product nahi hai. Add Product se apna pehla product add karo."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
              Showing {filteredProducts.length} of {products.length} loaded
              products
            </div>
          </div>
        )}
      </div>

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4 sm:items-center">
          <div className="my-4 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Edit Product
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Product details update karo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close edit form"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Product Name *
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  value={editForm.name}
                  onChange={(e) => updateEditField("name", e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    SKU *
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                    value={editForm.sku}
                    onChange={(e) => updateEditField("sku", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Category *
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                    value={editForm.category}
                    onChange={(e) =>
                      updateEditField("category", e.target.value)
                    }
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Brand
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                    value={editForm.brand}
                    onChange={(e) => updateEditField("brand", e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                    value={editForm.price}
                    onChange={(e) => updateEditField("price", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    MRP (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                    value={editForm.compareAtPrice}
                    onChange={(e) =>
                      updateEditField("compareAtPrice", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                    value={editForm.stock}
                    onChange={(e) => updateEditField("stock", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  First Image URL
                </label>
                <input
                  type="url"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  value={editForm.imageUrl}
                  onChange={(e) => updateEditField("imageUrl", e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Short Description
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  value={editForm.shortDescription}
                  onChange={(e) =>
                    updateEditField("shortDescription", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Full Description
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  value={editForm.description}
                  onChange={(e) =>
                    updateEditField("description", e.target.value)
                  }
                />
              </div>

              <div className="flex flex-wrap gap-5">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.isFeatured}
                    onChange={(e) =>
                      updateEditField("isFeatured", e.target.checked)
                    }
                    className="accent-rose-600"
                  />
                  Featured
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.isBestSeller}
                    onChange={(e) =>
                      updateEditField("isBestSeller", e.target.checked)
                    }
                    className="accent-rose-600"
                  />
                  Best Seller
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  <Save size={17} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
