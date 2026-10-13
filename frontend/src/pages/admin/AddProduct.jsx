
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  X,
  ImagePlus,
  LoaderCircle,
  Save,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../services/api";

const categories = [
  "Electrical Items",
  "LED Lights",
  "Fans",
  "Wires & Cables",
  "Switches",
  "Coolers",
  "Home Appliances",
  "Other Electronics",
];

const initialForm = {
  name: "",
  sku: "",
  category: "",
  subcategory: "",
  brand: "",
  model: "",
  shortDescription: "",
  description: "",
  price: "",
  compareAtPrice: "",
  stock: "0",
  images: [],
  specifications: [],
  warranty: {
    duration: "",
    unit: "years",
    description: "",
  },
  isFeatured: false,
  isBestSeller: false,
};

export default function AddProduct() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const updateWarranty = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      warranty: {
        ...previous.warranty,
        [name]: value,
      },
    }));
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ];

    const validFiles = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: JPG, PNG, WEBP ya AVIF image select karein.`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: Image 5 MB se chhoti honi chahiye.`);
        continue;
      }

      validFiles.push(file);
    }

    if (!validFiles.length) return;

    setUploading(true);
    let uploadedCount = 0;

    try {
      for (const file of validFiles) {
        const data = new FormData();
        data.append("image", file);

        const response = await api.post(
          "/admin/products/upload-image",
          data,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (!response.data?.success || !response.data?.image?.url) {
          throw new Error("Image upload response sahi nahi hai.");
        }

        setForm((previous) => ({
          ...previous,
          images: [...previous.images, response.data.image],
        }));

        uploadedCount++;
      }

      if (uploadedCount > 0) {
        toast.success(
          `${uploadedCount} image upload ${uploadedCount === 1 ? "ho gayi" : "ho gayi hain"}.`
        );
      }
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Image upload nahi ho payi."
      );
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove) => {
    setForm((previous) => ({
      ...previous,
      images: previous.images.filter(
        (_, index) => index !== indexToRemove
      ),
    }));
  };

  const addSpecification = () => {
    setForm((previous) => ({
      ...previous,
      specifications: [
        ...previous.specifications,
        { name: "", value: "" },
      ],
    }));
  };

  const updateSpecification = (index, field, value) => {
    setForm((previous) => ({
      ...previous,
      specifications: previous.specifications.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeSpecification = (indexToRemove) => {
    setForm((previous) => ({
      ...previous,
      specifications: previous.specifications.filter(
        (_, index) => index !== indexToRemove
      ),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Product name enter karein.");
      return;
    }

    if (!form.sku.trim()) {
      toast.error("Product SKU enter karein.");
      return;
    }

    if (!form.category) {
      toast.error("Product category select karein.");
      return;
    }

    if (form.price === "" || Number(form.price) < 0) {
      toast.error("Valid product price enter karein.");
      return;
    }

    if (
      form.compareAtPrice !== "" &&
      Number(form.compareAtPrice) < 0
    ) {
      toast.error("Valid original price enter karein.");
      return;
    }

    if (
      form.compareAtPrice !== "" &&
      Number(form.compareAtPrice) <= Number(form.price)
    ) {
      toast.error("Original price selling price se zyada honi chahiye.");
      return;
    }

    if (
      form.stock === "" ||
      !Number.isInteger(Number(form.stock)) ||
      Number(form.stock) < 0
    ) {
      toast.error("Stock quantity zero ya positive whole number honi chahiye.");
      return;
    }

    if (uploading) {
      toast.error("Images upload hone ka wait karein.");
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      sku: form.sku.trim(),
      category: form.category,
      subcategory: form.subcategory.trim(),
      brand: form.brand.trim(),
      model: form.model.trim(),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      compareAtPrice:
        form.compareAtPrice === ""
          ? null
          : Number(form.compareAtPrice),
      stock: Number(form.stock),
      images: form.images,
      specifications: form.specifications
        .filter((item) => item.name.trim() && item.value.trim())
        .map((item) => ({
          name: item.name.trim(),
          value: item.value.trim(),
        })),
      warranty: {
        ...form.warranty,
        duration:
          form.warranty.duration === ""
            ? 0
            : Number(form.warranty.duration),
        description: form.warranty.description.trim(),
      },
    };

    setSaving(true);

    try {
      const response = await api.post("/admin/products", payload);

      if (response.data?.success) {
        toast.success("Product successfully add ho gaya!");
        navigate("/admin/products");
      } else {
        toast.error(response.data?.message || "Product save nahi hua.");
      }
    } catch (error) {
      console.error("Product save error:", error);
      toast.error(
        error.response?.data?.message ||
          "Product save nahi hua. Backend aur required fields check karein."
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100";

  const labelClass = "block text-sm font-medium text-slate-700";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate("/admin/products")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-pink-600"
        >
          <ArrowLeft size={18} />
          Back to Products
        </button>

        <div className="mb-7">
          <p className="text-sm font-semibold uppercase tracking-wider text-pink-600">
            Vishal Electricals Admin
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Add New Product
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Product details bharein aur computer se product photos upload karein.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-bold text-slate-900">
              Basic Information
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className={labelClass}>
                Product Name *
                <input
                  className={inputClass}
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="e.g. LED Bulb 12W"
                  required
                />
              </label>

              <label className={labelClass}>
                SKU / Product Code *
                <input
                  className={inputClass}
                  name="sku"
                  value={form.sku}
                  onChange={updateField}
                  placeholder="e.g. LED-012"
                  required
                />
              </label>

              <label className={labelClass}>
                Category *
                <select
                  className={inputClass}
                  name="category"
                  value={form.category}
                  onChange={updateField}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className={labelClass}>
                Subcategory
                <input
                  className={inputClass}
                  name="subcategory"
                  value={form.subcategory}
                  onChange={updateField}
                  placeholder="e.g. LED Bulbs"
                />
              </label>

              <label className={labelClass}>
                Brand
                <input
                  className={inputClass}
                  name="brand"
                  value={form.brand}
                  onChange={updateField}
                  placeholder="Brand name"
                />
              </label>

              <label className={labelClass}>
                Model Number
                <input
                  className={inputClass}
                  name="model"
                  value={form.model}
                  onChange={updateField}
                  placeholder="Model number"
                />
              </label>
            </div>

            <div className="mt-5 grid gap-5">
              <label className={labelClass}>
                Short Description
                <input
                  className={inputClass}
                  name="shortDescription"
                  value={form.shortDescription}
                  onChange={updateField}
                  placeholder="Short product summary"
                />
              </label>

              <label className={labelClass}>
                Full Description
                <textarea
                  className={inputClass}
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  rows={4}
                  placeholder="Product ke features aur details likhein..."
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-bold text-slate-900">
              Pricing & Stock
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              <label className={labelClass}>
                Selling Price (₹) *
                <input
                  className={inputClass}
                  type="number"
                  name="price"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={updateField}
                  placeholder="499"
                  required
                />
              </label>

              <label className={labelClass}>
                Original Price (₹)
                <input
                  className={inputClass}
                  type="number"
                  name="compareAtPrice"
                  min="0"
                  step="0.01"
                  value={form.compareAtPrice}
                  onChange={updateField}
                  placeholder="599"
                />
              </label>

              <label className={labelClass}>
                Available Stock *
                <input
                  className={inputClass}
                  type="number"
                  name="stock"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={updateField}
                  required
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-5">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      isFeatured: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-pink-600"
                />
                Featured Product
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isBestSeller}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      isBestSeller: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-pink-600"
                />
                Best Seller
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Product Images
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  JPG, PNG, WEBP ya AVIF · Maximum 5 MB per image
                </p>
              </div>

              <label
                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 ${
                  uploading ? "pointer-events-none opacity-60" : ""
                }`}
              >
                {uploading ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <Upload size={18} />
                )}
                {uploading ? "Uploading..." : "Choose Images"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  disabled={uploading}
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {form.images.length === 0 ? (
              <div className="mt-5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-5 py-12 text-center">
                <ImagePlus size={40} className="text-slate-400" />
                <p className="mt-3 font-medium text-slate-700">
                  No product images selected
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Choose Images par click karke computer se photos select karein.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {form.images.map((image, index) => (
                  <div
                    key={`${image.publicId || image.url}-${index}`}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                  >
                    <div className="relative aspect-square bg-slate-100">
                      <img
                        src={image.url}
                        alt={image.alt || form.name || "Product image"}
                        className="h-full w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        aria-label="Remove image"
                        className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-red-600 shadow hover:bg-red-50"
                      >
                        <X size={17} />
                      </button>
                    </div>
                    <p className="truncate px-3 py-2 text-xs text-slate-500">
                      {image.alt || `Product image ${index + 1}`}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-3 text-xs text-slate-500">
              Images Cloudinary par upload hoti hain. Product save karne par unke URLs database mein store honge.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">
                Product Specifications
              </h2>

              <button
                type="button"
                onClick={addSpecification}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
              >
                <Plus size={17} />
                Add Specification
              </button>
            </div>

            {form.specifications.length === 0 && (
              <p className="mt-4 text-sm text-slate-500">
                Optional: wattage, colour, material, size, etc. add kar sakte hain.
              </p>
            )}

            <div className="mt-4 space-y-3">
              {form.specifications.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-3 sm:flex-row"
                >
                  <input
                    className={`${inputClass} mt-0`}
                    value={item.name}
                    onChange={(event) =>
                      updateSpecification(index, "name", event.target.value)
                    }
                    placeholder="Specification name"
                  />

                  <input
                    className={`${inputClass} mt-0`}
                    value={item.value}
                    onChange={(event) =>
                      updateSpecification(index, "value", event.target.value)
                    }
                    placeholder="Value"
                  />

                  <button
                    type="button"
                    onClick={() => removeSpecification(index)}
                    aria-label="Remove specification"
                    className="flex shrink-0 items-center justify-center rounded-lg border border-red-200 px-3 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-bold text-slate-900">
              Warranty Details
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              <label className={labelClass}>
                Warranty Duration
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  name="duration"
                  value={form.warranty.duration}
                  onChange={updateWarranty}
                  placeholder="e.g. 2"
                />
              </label>

              <label className={labelClass}>
                Duration Unit
                <select
                  className={inputClass}
                  name="unit"
                  value={form.warranty.unit}
                  onChange={updateWarranty}
                >
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </label>

              <label className={labelClass}>
                Warranty Description
                <input
                  className={inputClass}
                  name="description"
                  value={form.warranty.description}
                  onChange={updateWarranty}
                  placeholder="Terms or details"
                />
              </label>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-pink-600 px-6 py-3 text-sm font-semibold text-white hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {saving ? "Saving Product..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
