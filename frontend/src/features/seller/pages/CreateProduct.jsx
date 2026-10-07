import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router";
import { useProduct } from "../../products/hooks/useProduct";

export default function CreateProduct() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { handleCreateProduct } = useProduct();

  const [form, setForm] = useState({
    title: "",
    description: "",
    priceAmount: "",
    priceCurrency: "INR",
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setImages((p) => [...p, ...files].slice(0, 5));
  };

  const removeImage = (idx) => {
    setImages((p) => p.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Product title is required");
      return;
    }
    if (!form.priceAmount) {
      alert("Product price is required");
      return;
    }
    if (images.length === 0) {
      alert("Please upload at least one image");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("priceAmount", form.priceAmount);
      formData.append("priceCurrency", form.priceCurrency);

      images.forEach((img) => {
        formData.append("images", img);
      });

      await handleCreateProduct(formData);

      alert("Product created successfully!");
      navigate("/seller/dashboard");
    } catch (err) {
      console.error("Create product error:", err);
      alert(err.response?.data?.message || err.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      <main className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-neutral-800">
          <h1 className="text-xl sm:text-2xl font-bold">Add New Product</h1>
          <Link
            to="/seller/dashboard"
            className="text-xs text-neutral-400 hover:text-white"
          >
            Cancel
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="e.g. Oversized Linen Shirt"
              value={form.title}
              onChange={handleChange}
              className="w-full bg-neutral-900 border border-neutral-800 text-white px-3 py-2.5 rounded focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              placeholder="Describe material, fit, and style..."
              value={form.description}
              onChange={handleChange}
              className="w-full bg-neutral-900 border border-neutral-800 text-white px-3 py-2.5 rounded focus:outline-none focus:border-white resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                Price (INR)
              </label>
              <input
                type="number"
                name="priceAmount"
                required
                min="0"
                placeholder="1999"
                value={form.priceAmount}
                onChange={handleChange}
                className="w-full bg-neutral-900 border border-neutral-800 text-white px-3 py-2.5 rounded focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                Currency
              </label>
              <select
                name="priceCurrency"
                value={form.priceCurrency}
                onChange={handleChange}
                className="w-full bg-neutral-900 border border-neutral-800 text-white px-3 py-2.5 rounded focus:outline-none focus:border-white cursor-pointer"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
              Photos (Upload up to 5)
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="w-full text-xs text-neutral-400 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-bold file:bg-white file:text-black hover:file:bg-neutral-200 file:cursor-pointer bg-neutral-900 border border-neutral-800 rounded p-2"
            />

            {images.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {images.map((img, i) => (
                  <div key={i} className="relative w-16 h-20 rounded overflow-hidden border border-neutral-700 bg-neutral-950">
                    <img
                      src={URL.createObjectURL(img)}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/80 text-white flex items-center justify-center text-[8px] cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
            <Link
              to="/seller/dashboard"
              className="px-4 py-2.5 text-xs font-semibold text-neutral-400 hover:text-white"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-white text-black font-bold text-xs uppercase tracking-wider rounded hover:bg-neutral-200 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Publishing..." : "Publish Product"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
