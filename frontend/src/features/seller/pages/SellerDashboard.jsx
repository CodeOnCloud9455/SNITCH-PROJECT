import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router";
import { useProduct } from "../../products/hooks/useProduct";
import { formatPrice, getImageUrl, getSafeId, getSafeAmount } from "../../products/utils/formatters";

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { handleGetSellerProduct } = useProduct();
  const sellerProducts = useSelector((state) => state.product?.sellerProducts) || [];

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        await handleGetSellerProduct();
      } catch (err) {
        console.error("Failed to load seller products:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const metrics = useMemo(() => {
    const total = sellerProducts.length;
    let totalVal = 0;
    sellerProducts.forEach((p) => {
      totalVal += getSafeAmount(p.price?.amount);
    });
    return {
      total,
      totalVal,
    };
  }, [sellerProducts]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return sellerProducts;
    const q = searchQuery.toLowerCase().trim();
    return sellerProducts.filter((p) => {
      const title = (p.title || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }, [sellerProducts, searchQuery]);

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        {/* Header & Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-neutral-800 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Seller Dashboard</h1>
            <p className="text-xs text-neutral-400 mt-0.5">Manage your product catalog and inventory</p>
          </div>

          <Link
            to="/seller/create-product"
            className="px-4 py-2 bg-white text-black font-bold text-xs uppercase tracking-wider rounded hover:bg-neutral-200 transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <span>+</span>
            <span>Add Product</span>
          </Link>
        </div>

        {/* 2 Simple Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Total Products</span>
            <span className="text-2xl font-bold text-white">{metrics.total}</span>
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Catalog Value</span>
            <span className="text-2xl font-bold text-white">₹{metrics.totalVal.toLocaleString("en-IN")}</span>
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Store Status</span>
            <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Active
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-80 bg-neutral-900 border border-neutral-800 text-white px-3 py-2 text-xs rounded outline-none focus:border-white placeholder:text-neutral-500"
          />
        </div>

        {/* Products List */}
        {loading && sellerProducts.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="animate-pulse bg-neutral-900 aspect-[3/4] rounded" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 border border-neutral-800 rounded p-8">
            <h3 className="text-base font-bold mb-1">No products found</h3>
            <p className="text-xs text-neutral-400 mb-4">
              {sellerProducts.length === 0
                ? "You haven't listed any products yet."
                : "No products matched your search query."}
            </p>
            {sellerProducts.length === 0 && (
              <Link
                to="/seller/create-product"
                className="px-4 py-2 bg-white text-black font-bold text-xs uppercase tracking-wider rounded hover:bg-neutral-200"
              >
                + Add Your First Product
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((p) => {
              const id = getSafeId(p._id || p.id);
              const imgUrl = getImageUrl(p.images?.[0]);
              const price = getSafeAmount(p.price?.amount);
              const currency = p.price?.currency || "INR";

              return (
                <div
                  key={id}
                  onClick={() => navigate(`/seller/product/${id}`)}
                  className="bg-neutral-900 border border-neutral-800 hover:border-neutral-500 rounded p-3 flex flex-col justify-between cursor-pointer transition-all duration-200 group"
                >
                  <div className="aspect-[3/4] w-full bg-neutral-950 rounded overflow-hidden mb-3 border border-neutral-800/60">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-600">
                        No Pic
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-white truncate group-hover:text-neutral-300 transition-colors">
                      {p.title || "Untitled"}
                    </h3>
                    <p className="text-xs font-semibold text-neutral-400 mt-1">
                      {formatPrice(price, currency)}
                    </p>
                  </div>

                  <div className="pt-2 mt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
                    <span>Manage</span>
                    <span>→</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
