import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useSearchParams, useNavigate } from "react-router";
import { useProduct } from "../hooks/useProduct";
import ProductCard from "../components/ProductCard";
import QuickViewModal from "../components/QuickViewModal";
import CartDrawer from "../components/CartDrawer";
import WishlistDrawer from "../components/WishlistDrawer";
import { getSafeAmount, getSafeId } from "../utils/formatters";
import { useCart } from "../../cart/hook/useCart";
import { useWishlist } from "../hooks/useWishlist";
import { CURATED_COLLECTION } from "../utils/curatedCollections";

export default function Home() {
  const backendProducts = useSelector((state) => state.product.products) || [];
  const loading = useSelector((state) => state.product.loading);
  const { handleGetAllProducts } = useProduct();
  const { handleAddItem, handleRemoveItem, handleUpdateQuantity, cartItems } = useCart();
  const { wishlistItems, isWishlisted, toggleWishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "all";
  const searchQuery = searchParams.get("search") || "";
  const activePriceRange = searchParams.get("price") || "all";

  // Local state
  const [sortBy, setSortBy] = useState("recommended");
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [gridCols, setGridCols] = useState(4); // 2, 3, or 4
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  useEffect(() => {
    handleGetAllProducts();

    const handleOpenWishlist = () => setWishlistOpen(true);
    window.addEventListener("snitch_open_wishlist", handleOpenWishlist);
    return () => window.removeEventListener("snitch_open_wishlist", handleOpenWishlist);
  }, []);

  // Combine backend products with rich variety curated products
  const allAvailableProducts = useMemo(() => {
    const combined = [...(Array.isArray(backendProducts) ? backendProducts : [])];
    const existingIds = new Set(combined.map((p) => getSafeId(p._id || p.id)));

    CURATED_COLLECTION.forEach((item) => {
      const id = getSafeId(item._id || item.id);
      if (!existingIds.has(id)) {
        combined.push(item);
        existingIds.add(id);
      }
    });

    return combined;
  }, [backendProducts]);

  // Filter & Sort logic
  const filteredProducts = useMemo(() => {
    let list = [...allAvailableProducts];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const words = q.split(/\s+/).filter(Boolean);

      list = list.filter((p) => {
        const variantText = Array.isArray(p.variants)
          ? p.variants.map((v) => Object.values(v.attributes || {}).join(" ")).join(" ")
          : "";
        const fullSearchText = `${p.title || ""} ${p.description || ""} ${p.category || ""} ${p.badge || ""} ${variantText}`.toLowerCase();

        return words.every((word) => fullSearchText.includes(word));
      });
    }

    // Category
    if (activeCategory !== "all") {
      list = list.filter((p) => {
        const categoryTag = (p.category || "").toLowerCase();
        const text = `${p.title || ""} ${p.description || ""}`.toLowerCase();
        if (activeCategory === "shirts") {
          return categoryTag === "shirts" || (text.includes("shirt") && !text.includes("t-shirt") && !text.includes("tee"));
        }
        if (activeCategory === "tees") {
          return categoryTag === "tees" || text.includes("tee") || text.includes("t-shirt");
        }
        if (activeCategory === "trousers") {
          return categoryTag === "trousers" || text.includes("pant") || text.includes("trouser") || text.includes("cargo") || text.includes("jean") || text.includes("sweatpant") || text.includes("bottom");
        }
        if (activeCategory === "outerwear") {
          return categoryTag === "outerwear" || text.includes("jacket") || text.includes("hoodie") || text.includes("sweater") || text.includes("coat") || text.includes("overshirt");
        }
        if (activeCategory === "shoes") {
          return categoryTag === "shoes" || text.includes("sneaker") || text.includes("shoe") || text.includes("footwear");
        }
        return true;
      });
    }

    // Price range filter
    if (activePriceRange !== "all") {
      list = list.filter((p) => {
        const amt = getSafeAmount(p.price?.amount || p.price);
        if (activePriceRange === "under1500") return amt < 1500;
        if (activePriceRange === "1500to3000") return amt >= 1500 && amt <= 3000;
        if (activePriceRange === "above3000") return amt > 3000;
        return true;
      });
    }

    // Sort
    list.sort((a, b) => {
      const priceA = getSafeAmount(a.price?.amount || a.price);
      const priceB = getSafeAmount(b.price?.amount || b.price);

      if (sortBy === "price-asc") return priceA - priceB;
      if (sortBy === "price-desc") return priceB - priceA;

      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return list;
  }, [allAvailableProducts, searchQuery, activeCategory, activePriceRange, sortBy]);

  const handleToggleWishlist = (product) => {
    const added = toggleWishlist(product);
    if (added) {
      showToast(`Added "${product.title || "Item"}" to Wishlist ❤️`);
    } else {
      showToast(`Removed from Wishlist`);
    }
  };

  const handleAddToCart = (product) => {
    const pId = getSafeId(product._id || product.id);
    const size = product.selectedSize || "M";
    const rawVars = product.variants || product.varients || [];
    const matchedVar = rawVars.find((v) => {
      const s = v.attributes?.Size || v.attributes?.size;
      return String(s).toLowerCase() === String(size).toLowerCase();
    }) || rawVars[0];

    const variantId = product.variantId || matchedVar?._id || matchedVar?.id;
    const baseDisplayPrice = product.displayPrice || product.price || { amount: 1499, currency: "INR" };
    const matchedVariantPrice = product.variantPrice || matchedVar?.price || product.price || baseDisplayPrice;

    handleAddItem({
      productId: pId,
      variantId,
      quantity: product.quantity || 1,
      product: {
        ...product,
        _id: pId,
        id: pId,
        variantId,
        selectedSize: size,
        displayPrice: baseDisplayPrice,
        variantPrice: matchedVariantPrice,
        price: matchedVariantPrice,
        stock: product.stock || matchedVar?.stock || 10,
        quantity: product.quantity || 1,
      },
    });
    showToast(`Added "${product.title || "Item"}" (${size}) to Cart!`);
    setCartOpen(true);
  };

  const handleMoveWishlistToCart = (item) => {
    handleAddToCart(item);
    removeFromWishlist(item._id || item.id);
  };

  const handleOpenQuickView = (product) => {
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  };

  const categoryTabs = [
    { id: "all", label: "All Drops" },
    { id: "shirts", label: "Linen & Shirts" },
    { id: "tees", label: "Oversized Tees" },
    { id: "trousers", label: "Pants & Cargos" },
    { id: "outerwear", label: "Jackets & Hoodies" },
    { id: "shoes", label: "Sneakers & Kicks" },
  ];

  const priceTabs = [
    { id: "all", label: "All Prices" },
    { id: "under1500", label: "Under ₹1,500" },
    { id: "1500to3000", label: "₹1,500 – ₹3,000" },
    { id: "above3000", label: "₹3,000+" },
  ];

  const handleSelectCategory = (categoryId) => {
    const newParams = new URLSearchParams(searchParams);
    if (categoryId === "all") {
      newParams.delete("category");
    } else {
      newParams.set("category", categoryId);
    }
    setSearchParams(newParams);
  };

  const handleSelectPrice = (priceId) => {
    const newParams = new URLSearchParams(searchParams);
    if (priceId === "all") {
      newParams.delete("price");
    } else {
      newParams.set("price", priceId);
    }
    setSearchParams(newParams);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    showToast(`Copied code "${code}" to clipboard!`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-sans selection:bg-white selection:text-black">
      {/* ─── Interactive Toast Feedback ─── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white text-black px-4 py-2.5 rounded-md shadow-2xl font-bold text-xs flex items-center gap-2 border border-neutral-300 animate-bounce">
          <span className="text-sm">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── Top Interactive Promo Bar with Marquee Animation ─── */}
      <div className="w-full bg-neutral-950 border-b border-neutral-800 text-[11px] py-2.5 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="bg-white text-black font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider font-space">
              FLASH DROP
            </span>
            <span className="text-neutral-300 font-medium">
              Get ₹500 OFF with code <strong className="text-white font-bold font-space">SNITCH500</strong> or 10% OFF with <strong className="text-white font-bold font-space">SNITCH10</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopyCode("SNITCH500")}
              className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-white font-bold transition-colors cursor-pointer text-[10px] border border-neutral-800 font-space"
            >
              Copy SNITCH500
            </button>
            <button
              onClick={() => handleCopyCode("SNITCH10")}
              className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-white font-bold transition-colors cursor-pointer text-[10px] border border-neutral-800 font-space"
            >
              Copy SNITCH10
            </button>
          </div>
        </div>
      </div>

      {/* ─── Animated Marquee Strip ─── */}
      <div className="w-full bg-neutral-900/60 border-b border-neutral-800/80 py-1.5 overflow-hidden select-none">
        <div className="animate-marquee whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-8 font-space">
          <span>⚡ NEW WINTER '26 CAPSULE</span>
          <span>•</span>
          <span>🔥 HEAVYWEIGHT 280GSM TEES</span>
          <span>•</span>
          <span>🚀 EXPRESS 24H DISPATCH</span>
          <span>•</span>
          <span>✨ RAW JAPANESE DENIM</span>
          <span>•</span>
          <span>🏷️ EXCLUSIVE FLAT ₹500 OFF</span>
          <span>•</span>
          <span>🤍 7-DAY EASY REPLACEMENTS</span>
          <span>•</span>
          <span>⚡ NEW WINTER '26 CAPSULE</span>
          <span>•</span>
          <span>🔥 HEAVYWEIGHT 280GSM TEES</span>
          <span>•</span>
          <span>🚀 EXPRESS 24H DISPATCH</span>
        </div>
      </div>

      {/* ─── Under-Navbar Aesthetic Clothing Lookbook Showcase Banner ─── */}
      <section className="relative w-full overflow-hidden border-b border-neutral-800 bg-black">
        {/* Main Hero Lookbook Container */}
        <div className="relative min-h-[440px] sm:min-h-[520px] lg:min-h-[580px] w-full flex items-center">
          {/* High-Resolution Clothes Lookbook Background Image */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.pexels.com/photos/8030176/pexels-photo-8030176.jpeg?auto=format&fit=crop&w=2000&q=85"
              alt="Curated Clothes Collection"
              className="w-full h-full object-cover object-center transition-transform duration-1000 scale-100 hover:scale-102 filter brightness-85"
            />
            {/* Cinematic Gradient Overlays for rich contrast and readable typography */}
            <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/60 to-black/30" />
            <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-black/40" />
          </div>

          {/* Interactive Lookbook Content */}
          <div className="relative z-10 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8">
            <div className="max-w-xl space-y-3 sm:space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-neutral-700 text-[10px] sm:text-[11px] font-bold text-white shadow-xl animate-glow">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-space uppercase tracking-widest text-[9px] sm:text-[10px]">NEW SEASON COLLECTION &apos;26</span>
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase leading-[1.05] font-brand drop-shadow-2xl">
                The Luxury <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-white via-neutral-200 to-neutral-400">
                  Wardrobe
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-neutral-300 max-w-md leading-relaxed font-body drop-shadow">
                Curated everyday luxury streetwear. Crafted from 280+ GSM heavyweight fabrics, bespoke tailoring, and minimalist silhouettes.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleSelectCategory("all");
                    window.scrollTo({ top: 700, behavior: "smooth" });
                  }}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white hover:bg-neutral-200 text-black font-black text-[11px] sm:text-xs uppercase tracking-wider rounded-md transition-all cursor-pointer font-space shadow-2xl hover:scale-105 flex items-center gap-1.5 sm:gap-2"
                >
                  <span>Explore Collection</span>
                  <span>→</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWishlistOpen(true)}
                  className="px-4 sm:px-5 py-2.5 sm:py-3 bg-black/70 backdrop-blur-md border border-neutral-600 hover:border-white text-white font-bold text-[11px] sm:text-xs uppercase tracking-wider rounded-md transition-all cursor-pointer font-space flex items-center gap-1.5 sm:gap-2 shadow-lg hover:scale-105"
                >
                  <span className="text-rose-500">❤️</span>
                  <span>Wishlist ({wishlistItems.length})</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pt-2 sm:pt-4 flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] font-space text-neutral-300">
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full border border-neutral-800">
                  <span>🚀</span>
                  <span>24H Dispatch</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full border border-neutral-800">
                  <span>🔄</span>
                  <span>7-Day Returns</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full border border-neutral-800">
                  <span>🔒</span>
                  <span>100% Genuine</span>
                </div>
              </div>
            </div>

            {/* Interactive Lookbook Capsule Hotspots Cards */}
            <div className="grid grid-cols-2 gap-3 w-full sm:w-auto max-w-sm sm:max-w-none">
              <div
                onClick={() => {
                  handleSelectCategory("shirts");
                  window.scrollTo({ top: 700, behavior: "smooth" });
                }}
                className="group relative w-full sm:w-44 md:w-48 aspect-[3/4] rounded-xl overflow-hidden border border-neutral-700/80 bg-neutral-950 cursor-pointer shadow-2xl transition-all duration-300 hover:border-white hover:scale-105"
              >
                <img
                  src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80"
                  alt="Linen & Shirts"
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-115"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/30 to-transparent flex flex-col justify-end p-2.5 sm:p-3.5">
                  <span className="text-[8px] sm:text-[9px] font-black text-neutral-300 uppercase tracking-widest font-space">
                    LOOK 01
                  </span>
                  <p className="text-[11px] sm:text-xs font-black text-white font-display uppercase tracking-wider">
                    Linen &amp; Shirts
                  </p>
                  <span className="text-[9px] sm:text-[10px] text-neutral-400 font-space mt-0.5">
                    From ₹1,899 →
                  </span>
                </div>
              </div>

              <div
                onClick={() => {
                  handleSelectCategory("trousers");
                  window.scrollTo({ top: 700, behavior: "smooth" });
                }}
                className="group relative w-full sm:w-44 md:w-48 aspect-[3/4] rounded-xl overflow-hidden border border-neutral-700/80 bg-neutral-950 cursor-pointer shadow-2xl transition-all duration-300 hover:border-white hover:scale-105 mt-2 sm:mt-6"
              >
                <img
                  src="https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80"
                  alt="Utility Cargos"
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-115"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/30 to-transparent flex flex-col justify-end p-2.5 sm:p-3.5">
                  <span className="text-[8px] sm:text-[9px] font-black text-neutral-300 uppercase tracking-widest font-space">
                    LOOK 02
                  </span>
                  <p className="text-[11px] sm:text-xs font-black text-white font-display uppercase tracking-wider">
                    Tactical Cargos
                  </p>
                  <span className="text-[9px] sm:text-[10px] text-neutral-400 font-space mt-0.5">
                    From ₹2,499 →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Category Quick Navigation Strip ─── */}
      <section className="w-full bg-neutral-950 border-b border-neutral-800/90 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "all", title: "All Clothes", icon: "✨" },
            { id: "tees", title: "Oversized Tees", icon: "👕" },
            { id: "shirts", title: "Linen Shirts", icon: "👔" },
            { id: "trousers", title: "Pants & Cargos", icon: "👖" },
            { id: "outerwear", title: "Jackets & Hoodies", icon: "🧥" },
            { id: "shoes", title: "Sneakers & Kicks", icon: "👟" },
          ].map((c) => {
            const isSelected = activeCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  handleSelectCategory(c.id);
                  handleSelectPrice("all");
                }}
                className={`px-4 py-2 rounded-md text-xs font-black whitespace-nowrap transition-all cursor-pointer font-space flex items-center gap-1.5 uppercase tracking-wider ${
                  isSelected
                    ? "bg-white text-black shadow-lg scale-105"
                    : "bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800"
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.title}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── Interactive Filter & Category Header ─── */}
      <section className="w-full border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">
          {/* Categories & Layout Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {categoryTabs.map((tab) => {
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSelectCategory(tab.id)}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all cursor-pointer font-space uppercase tracking-wider ${
                      isActive
                        ? "bg-white text-black shadow-md scale-105"
                        : "bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Grid & Sort Controls */}
            <div className="flex items-center gap-3 text-xs text-neutral-400 ml-auto">
              <span className="font-bold text-neutral-300 font-space">{filteredProducts.length} items</span>

              {/* Grid column buttons */}
              <div className="hidden sm:flex items-center border border-neutral-800 rounded bg-neutral-900 p-0.5">
                <button
                  onClick={() => setGridCols(2)}
                  className={`px-2.5 py-1 text-[10px] font-black rounded cursor-pointer font-space ${
                    gridCols === 2 ? "bg-white text-black" : "text-neutral-400 hover:text-white"
                  }`}
                  title="2 Columns"
                >
                  2x
                </button>
                <button
                  onClick={() => setGridCols(3)}
                  className={`px-2.5 py-1 text-[10px] font-black rounded cursor-pointer font-space ${
                    gridCols === 3 ? "bg-white text-black" : "text-neutral-400 hover:text-white"
                  }`}
                  title="3 Columns"
                >
                  3x
                </button>
                <button
                  onClick={() => setGridCols(4)}
                  className={`px-2.5 py-1 text-[10px] font-black rounded cursor-pointer font-space ${
                    gridCols === 4 ? "bg-white text-black" : "text-neutral-400 hover:text-white"
                  }`}
                  title="4 Columns"
                >
                  4x
                </button>
              </div>

              {/* Sort selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-neutral-900 text-white text-xs px-3 py-1.5 rounded border border-neutral-800 outline-none cursor-pointer focus:border-white font-space uppercase"
              >
                <option value="recommended">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Quick Price Filters Bar */}
          <div className="flex items-center gap-2 pt-1 border-t border-neutral-900 overflow-x-auto scrollbar-none text-xs">
            <span className="text-neutral-500 font-black text-[10px] uppercase font-space mr-1 tracking-wider">Price:</span>
            {priceTabs.map((p) => {
              const isSelected = activePriceRange === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPrice(p.id)}
                  className={`px-2.5 py-1 rounded text-[11px] transition-all cursor-pointer font-space ${
                    isSelected
                      ? "bg-neutral-200 text-black font-black"
                      : "bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}

            {(activeCategory !== "all" || activePriceRange !== "all" || searchQuery) && (
              <button
                onClick={() => setSearchParams({})}
                className="text-neutral-400 hover:text-rose-400 text-[11px] underline ml-auto whitespace-nowrap cursor-pointer font-space font-semibold"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─── Product Catalog Grid ─── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search status if active */}
        {searchQuery && (
          <div className="mb-4 flex items-center gap-2 text-xs text-neutral-400 bg-neutral-900 p-2.5 rounded border border-neutral-800">
            <span>Results for:</span>
            <span className="font-bold text-white">&ldquo;{searchQuery}&rdquo;</span>
            <button
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete("search");
                setSearchParams(newParams);
              }}
              className="text-neutral-400 hover:text-white underline ml-auto cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        )}

        {loading && allAvailableProducts.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="animate-pulse rounded-lg bg-neutral-900 aspect-[3/4]" />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div
            className={`grid grid-cols-2 gap-4 sm:gap-6 ${
              gridCols === 2
                ? "md:grid-cols-2"
                : gridCols === 3
                ? "md:grid-cols-3"
                : "md:grid-cols-3 lg:grid-cols-4"
            }`}
          >
            {filteredProducts.map((prod) => {
              const id = getSafeId(prod._id || prod.id);
              return (
                <ProductCard
                  key={id || prod.title}
                  product={prod}
                  isWishlisted={isWishlisted(prod)}
                  onToggleWishlist={handleToggleWishlist}
                  onQuickView={handleOpenQuickView}
                  onAddToCart={handleAddToCart}
                  onClick={(p) => navigate(`/product/${getSafeId(p._id || p.id)}`)}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-neutral-900/40 border border-neutral-800 rounded-lg p-8">
            <h3 className="text-base font-bold text-white mb-1 font-display">No products found</h3>
            <p className="text-xs text-neutral-400 mb-4">Try checking your search, price, or category filters.</p>
            <button
              onClick={() => {
                setSearchParams({});
              }}
              className="px-5 py-2.5 text-xs font-black bg-white text-black rounded hover:bg-neutral-200 cursor-pointer uppercase tracking-wider font-space"
            >
              View All Products
            </button>
          </div>
        )}
      </main>

      {/* ─── Simple Crisp Footer ─── */}
      <footer className="w-full bg-neutral-950 border-t border-neutral-800 py-6 text-xs text-neutral-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-brand font-black text-white tracking-widest uppercase text-base">SNITCH</p>
          <p className="font-space">&copy; {new Date().getFullYear()} SNITCH LUXURY APPAREL. All rights reserved.</p>
        </div>
      </footer>

      {/* ─── Quick View Modal ─── */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        onAddToCart={handleAddToCart}
      />

      {/* ─── Cart Drawer ─── */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onRemoveItem={handleRemoveItem}
        onUpdateQuantity={handleUpdateQuantity}
      />

      {/* ─── Wishlist Drawer ─── */}
      <WishlistDrawer
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        items={wishlistItems}
        onRemoveItem={(id) => {
          removeFromWishlist(id);
          showToast("Removed item from Wishlist");
        }}
        onMoveToCart={handleMoveWishlistToCart}
        onClearWishlist={() => {
          clearWishlist();
          showToast("Wishlist cleared");
        }}
      />
    </div>
  );
}


