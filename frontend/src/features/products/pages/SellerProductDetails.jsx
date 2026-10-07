import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useSelector } from "react-redux";
import { useProduct } from "../hooks/useProduct";
import { formatPrice, getImageUrl, getSafeId, getSafeAmount } from "../utils/formatters";

function getAttributeEntries(attrs) {
  if (!attrs) return [];
  if (attrs instanceof Map) return Array.from(attrs.entries());
  if (typeof attrs === "object") return Object.entries(attrs);
  return [];
}

export default function SellerProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const {
    handleGetProductById,
    handleCreateVariant,
    handleUpdateVariantStock,
    handleDeleteVariant,
  } = useProduct();

  const sellerProducts = useSelector((state) => state.product.sellerProducts) || [];
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Variant Modal State
  const [showModal, setShowModal] = useState(false);
  const [attrKey, setAttrKey] = useState("Size");
  const [attrVal, setAttrVal] = useState("");
  const [stock, setStock] = useState(25);
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const found = sellerProducts.find(
          (p) => getSafeId(p._id) === productId || p._id === productId
        );
        if (found) setProduct(found);

        const fetched = await handleGetProductById(productId);
        if (fetched) setProduct(fetched);
      } catch (err) {
        console.error("Error loading product:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  const rawVariants = Array.isArray(product?.varients)
    ? product.varients
    : Array.isArray(product?.variants)
    ? product.variants
    : [];

  const handleStockDelta = async (variantId, delta) => {
    try {
      const updated = await handleUpdateVariantStock(product._id || productId, variantId, { delta });
      if (updated) {
        setProduct(updated);
      } else {
        setProduct((prev) => {
          if (!prev) return prev;
          const vars = (prev.varients || prev.variants || []).map((v) => {
            if (getSafeId(v._id) === variantId) {
              return { ...v, stock: Math.max(0, (v.stock || 0) + delta) };
            }
            return v;
          });
          return { ...prev, varients: vars };
        });
      }
    } catch (err) {
      console.error("Failed to update stock:", err);
    }
  };

  const handleDelete = async (variantId) => {
    if (!window.confirm("Remove this variant?")) return;
    try {
      const updated = await handleDeleteVariant(product._id || productId, variantId);
      if (updated) setProduct(updated);
      else {
        setProduct((prev) => {
          if (!prev) return prev;
          const vars = (prev.varients || prev.variants || []).filter(
            (v) => getSafeId(v._id) !== variantId
          );
          return { ...prev, varients: vars };
        });
      }
    } catch (err) {
      console.error("Failed to delete variant:", err);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!attrKey.trim() || !attrVal.trim()) {
      alert("Please provide both attribute name and value.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("attributes", JSON.stringify({ [attrKey.trim()]: attrVal.trim() }));
      formData.append("stock", String(stock));
      if (price) {
        formData.append("priceAmount", String(price));
        formData.append("priceCurrency", product?.price?.currency || "INR");
      }

      const updated = await handleCreateVariant(product._id || productId, formData);
      if (updated) setProduct(updated);
      else {
        const refreshed = await handleGetProductById(product._id || productId);
        if (refreshed) setProduct(refreshed);
      }

      setShowModal(false);
      setAttrVal("");
      setPrice("");
    } catch (err) {
      console.error("Failed to create variant:", err);
      alert(err.response?.data?.message || "Failed to create variant.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !product) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Product Not Found</h2>
        <Link to="/seller/dashboard" className="text-xs underline text-neutral-400">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const imgUrl = getImageUrl(product.images?.[0]);
  const basePrice = getSafeAmount(product.price?.amount);
  const currency = product.price?.currency || "INR";

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <Link
            to="/seller/dashboard"
            className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1"
          >
            <span>←</span>
            <span>Back to Dashboard</span>
          </Link>
          <Link
            to={`/product/${product._id || productId}`}
            className="text-xs font-semibold text-neutral-300 hover:text-white"
          >
            View in Store ↗
          </Link>
        </div>

        {/* Product Overview Card */}
        <div className="p-4 sm:p-6 bg-neutral-900 border border-neutral-800 rounded flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-24 h-32 bg-neutral-950 rounded overflow-hidden flex-shrink-0 border border-neutral-800">
            {imgUrl ? (
              <img src={imgUrl} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-neutral-600">
                No Pic
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold">{product.title}</h1>
            <p className="text-xs text-neutral-400 line-clamp-2">{product.description}</p>
            <div className="pt-2 flex items-center gap-4 text-xs font-semibold">
              <span>Price: <strong className="text-white">{formatPrice(basePrice, currency)}</strong></span>
              <span>•</span>
              <span>Variants: <strong className="text-white">{rawVariants.length}</strong></span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-white text-black font-bold text-xs uppercase tracking-wider rounded hover:bg-neutral-200 cursor-pointer flex-shrink-0"
          >
            + Add Variant
          </button>
        </div>

        {/* Variants Section */}
        <div className="p-4 sm:p-6 bg-neutral-900 border border-neutral-800 rounded space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Inventory Variants ({rawVariants.length})
            </h2>
          </div>

          {rawVariants.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-xs">
              <p className="mb-3">No variants created yet.</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-white text-black font-bold text-xs rounded hover:bg-neutral-200 cursor-pointer"
              >
                + Add Variant Option
              </button>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {rawVariants.map((v, idx) => {
                const vId = getSafeId(v._id || idx);
                const attrEntries = getAttributeEntries(v.attributes);
                const vStock = Number(v.stock) || 0;
                const vPrice = v.price?.amount ? formatPrice(v.price.amount, v.price.currency || currency) : null;

                return (
                  <div key={vId} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {attrEntries.map(([k, val], i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-neutral-800 text-white font-semibold">
                            {k}: {val}
                          </span>
                        ))}
                      </div>
                      {vPrice && <span className="text-[11px] text-neutral-400 mt-1 block">{vPrice}</span>}
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Stock Stepper */}
                      <div className="flex items-center border border-neutral-700 bg-neutral-950 rounded">
                        <button
                          type="button"
                          onClick={() => handleStockDelta(vId, -1)}
                          disabled={vStock <= 0}
                          className="px-2.5 py-1 text-neutral-400 hover:text-white cursor-pointer disabled:opacity-30"
                        >
                          −
                        </button>
                        <span className="px-2 text-xs font-bold text-white min-w-6 text-center">
                          {vStock}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStockDelta(vId, 1)}
                          className="px-2.5 py-1 text-neutral-400 hover:text-white cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDelete(vId)}
                        className="text-xs text-neutral-500 hover:text-rose-400 cursor-pointer"
                        title="Delete variant"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ─── Add Variant Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="text-sm font-bold text-white">Add Product Variant</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-500 hover:text-white cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                  Attribute Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Size or Color"
                  value={attrKey}
                  onChange={(e) => setAttrKey(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 text-white px-3 py-2 rounded focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                  Attribute Value
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. XL or Noir Black"
                  value={attrVal}
                  onChange={(e) => setAttrVal(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 text-white px-3 py-2 rounded focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stock}
                  onChange={(e) => setStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-neutral-950 border border-neutral-700 text-white px-3 py-2 rounded focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                  Custom Price (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Leave blank to use base price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 text-white px-3 py-2 rounded focus:outline-none focus:border-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-white text-black font-bold text-xs uppercase tracking-wider rounded hover:bg-neutral-200 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Variant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
