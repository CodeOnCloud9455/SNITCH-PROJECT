import { useState } from "react";
import { formatPrice, getImageUrl } from "../utils/formatters";

export default function ProductCard({
  product,
  onQuickView,
  onAddToCart,
  isWishlisted = false,
  onToggleWishlist,
  onClick,
}) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState("M");
  const [isAdded, setIsAdded] = useState(false);

  if (!product) return null;

  const images = Array.isArray(product.images) ? product.images : [];
  const primaryImg = getImageUrl(images[0]);
  const secondaryImg = images.length > 1 ? getImageUrl(images[1]) : primaryImg;

  const amount = Number(product.price?.amount || product.price) || 0;
  const currency = product.price?.currency || "INR";
  const originalAmount = Math.round(amount * 1.65);
  const discountPercent = Math.round(((originalAmount - amount) / originalAmount) * 100);

  const formattedPrice = formatPrice(amount, currency);
  const formattedOriginalPrice = formatPrice(originalAmount, currency);

  const availableSizes = ["S", "M", "L", "XL"];
  const ratingScore = (4.2 + ((product.title?.length || 5) % 8) * 0.1).toFixed(1);
  const reviewCount = `${Math.floor(100 + ((amount * 7) % 900))} ratings`;

  const handleQuickAdd = (e, size = selectedSize) => {
    e.stopPropagation();
    if (onAddToCart) {
      const rawVars = product.variants || product.varients || [];
      const matchedVar = rawVars.find((v) => {
        const s = v.attributes?.Size || v.attributes?.size;
        return String(s).toLowerCase() === String(size).toLowerCase();
      }) || rawVars[0];

      const baseDisplayPrice = product.price || { amount: 1499, currency: "INR" };
      const matchedVariantPrice = matchedVar?.price || baseDisplayPrice;

      onAddToCart({
        ...product,
        selectedSize: size,
        quantity: 1,
        displayPrice: baseDisplayPrice,
        variantPrice: matchedVariantPrice,
        price: matchedVariantPrice,
        stock: matchedVar?.stock || product.stock || 10,
        variantId: matchedVar?._id || matchedVar?.id,
      });
    }
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1600);
  };

  return (
    <div
      className="group relative flex flex-col bg-neutral-900/95 rounded-xl border border-neutral-800 hover:border-neutral-500 transition-all duration-300 overflow-hidden shadow-md hover:shadow-2xl cursor-pointer hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (onClick) {
          onClick(product);
        } else if (onQuickView) {
          onQuickView(product);
        }
      }}
    >
      {/* ─── Image Container (with Flipkart/Myntra Dual Image Hover Switch) ─── */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-950">
        {primaryImg && !imageError ? (
          <>
            <img
              src={isHovered && secondaryImg ? secondaryImg : primaryImg}
              alt={product.title || "Product image"}
              onError={() => setImageError(true)}
              loading="lazy"
              className="w-full h-full object-cover object-top transition-all duration-500 group-hover:scale-105 filter group-hover:brightness-105"
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-neutral-600">
            <span className="text-xs uppercase font-semibold">No Image</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
          <span className="bg-white text-black text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider shadow-md font-space">
            {product.badge || "NEW DROP"}
          </span>
        </div>

        {/* ─── Flipkart / Myntra Wishlist Button on Hover ─── */}
        <div className="absolute top-2.5 right-2.5 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist && onToggleWishlist(product);
            }}
            className={`hover-heart-beat w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shadow-lg group/wishlist ${
              isWishlisted
                ? "bg-rose-600 text-white scale-110 shadow-[0_0_12px_rgba(225,29,72,0.6)] animate-heart-pop"
                : "bg-black/60 backdrop-blur-md text-neutral-300 hover:text-rose-500 hover:bg-white hover:scale-125 hover:shadow-[0_0_15px_rgba(255,255,255,0.6)]"
            }`}
            title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <svg
              className={`w-4 h-4 transition-all duration-200 ${
                isWishlisted ? "fill-white text-white" : "group-hover/wishlist:scale-125 group-hover/wishlist:fill-rose-500 group-hover/wishlist:text-rose-500"
              }`}
              fill={isWishlisted ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </button>
        </div>

        {/* ─── Myntra Style Rating Badge ─── */}
        <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none group-hover:opacity-0 transition-opacity duration-200">
          <div className="bg-black/75 backdrop-blur-md text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border border-neutral-700/80 font-space shadow">
            <span className="text-amber-400 font-black">★ {ratingScore}</span>
            <span className="text-neutral-500">|</span>
            <span className="text-neutral-300">{reviewCount}</span>
          </div>
        </div>

        {/* ─── Myntra Style Slide-Up Quick Size Selector Overlay on Hover ─── */}
        <div className="absolute inset-x-2 bottom-2 z-20 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <div
            className="bg-neutral-950/95 backdrop-blur-md border border-neutral-700 rounded-lg p-2 shadow-2xl flex flex-col gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-neutral-400 font-space tracking-wider">
                Select Size:
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickView && onQuickView(product);
                }}
                className="text-[9px] font-bold text-neutral-300 hover:text-white underline font-space"
              >
                Quick View 👁️
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {availableSizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={(e) => {
                    setSelectedSize(s);
                    handleQuickAdd(e, s);
                  }}
                  className="py-1 rounded text-xs font-black bg-neutral-900 hover:bg-white hover:text-black text-white border border-neutral-700 hover:border-white transition-all cursor-pointer text-center font-space hover:scale-105"
                  title={`Select size ${s}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Product Details (Flipkart / Myntra Style) ─── */}
      <div className="p-2.5 sm:p-3.5 bg-neutral-900 flex flex-col justify-between flex-1 gap-1.5 sm:gap-2">
        <div>
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-[9px] sm:text-[10px] font-black text-neutral-400 uppercase tracking-widest font-space">
              SNITCH
            </span>
            <span className="text-[9px] sm:text-[10px] text-emerald-400 font-bold font-space">
              In Stock
            </span>
          </div>

          <h3
            className="text-xs sm:text-sm text-neutral-200 truncate font-bold group-hover:text-white transition-colors font-display"
            title={product.title}
          >
            {product.title || "Product"}
          </h3>
        </div>

        {/* Pricing Row (Myntra Style: ₹Current, ₹MRP Strikethrough, % OFF) */}
        <div className="flex items-baseline gap-1.5 sm:gap-2 pt-0.5 flex-wrap">
          <span className="text-xs sm:text-base font-black text-white font-space">
            {formattedPrice}
          </span>
          <span className="text-[10px] sm:text-[11px] text-neutral-500 line-through font-space">
            {formattedOriginalPrice}
          </span>
          <span className="text-[9px] sm:text-[11px] font-black text-emerald-400 font-space">
            ({discountPercent}% OFF)
          </span>
        </div>

        {/* Interactive Add to Cart Button */}
        <div className="pt-1.5 sm:pt-2 border-t border-neutral-800/90">
          <button
            type="button"
            onClick={(e) => handleQuickAdd(e, selectedSize)}
            className={`w-full py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm font-space ${
              isAdded
                ? "bg-emerald-500 text-black font-black scale-102"
                : "bg-white text-black hover:bg-neutral-200 hover:shadow-lg active:scale-98"
            }`}
          >
            {isAdded ? (
              <>
                <span className="text-sm">✓</span>
                <span>Added to Cart</span>
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


