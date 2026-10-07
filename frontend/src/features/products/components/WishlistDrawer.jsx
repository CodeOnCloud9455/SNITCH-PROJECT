import { useState } from "react";
import { formatPrice, getImageUrl, getSafeId } from "../utils/formatters";

export default function WishlistDrawer({
  isOpen,
  onClose,
  items = [],
  onRemoveItem,
  onMoveToCart,
  onClearWishlist,
}) {
  const [selectedSizes, setSelectedSizes] = useState({});

  if (!isOpen) return null;

  const availableSizes = ["S", "M", "L", "XL"];

  const handleSelectSize = (itemId, size) => {
    setSelectedSizes((prev) => ({
      ...prev,
      [itemId]: size,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Centered Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Spacious Center-Aligned Modal UI (Myntra/Flipkart Grid Design) */}
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-neutral-950 border border-neutral-700/80 rounded-2xl text-white shadow-2xl z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-neutral-900/95 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-600/20 border border-rose-500/40 text-rose-500 flex items-center justify-center text-lg">
              ❤️
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black uppercase tracking-wider font-brand">
                My Wishlist
              </h2>
              <p className="text-[11px] text-neutral-400 font-space">
                {items.length} {items.length === 1 ? "item" : "items"} saved in your shortlist
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {items.length > 0 && (
              <button
                type="button"
                onClick={onClearWishlist}
                className="text-[11px] text-neutral-400 hover:text-rose-400 underline cursor-pointer font-space mr-1"
              >
                Clear All
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-space font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>← Continue Shopping</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center text-xs cursor-pointer transition-colors"
              title="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Wishlist Items Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {items.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-3xl text-rose-500/80 mb-1">
                🤍
              </div>
              <h3 className="text-lg font-black text-white font-brand uppercase tracking-wider">
                YOUR WISHLIST IS EMPTY
              </h3>
              <p className="text-xs text-neutral-400 font-body">
                Explore luxury streetwear &amp; everyday essentials. Tap the heart icon to save items here.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-white text-black text-xs font-black uppercase tracking-wider rounded-md hover:bg-neutral-200 cursor-pointer font-space transition-all shadow-xl hover:scale-105 mt-2"
              >
                ← Continue Shopping
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
              {items.map((item, idx) => {
                const pId = getSafeId(item._id || item.id || idx);
                const imgUrl = getImageUrl(item.images?.[0] || item.image || item.variantThumbnail);
                const amount = Number(item.price?.amount || item.price) || 0;
                const currency = item.price?.currency || "INR";
                const originalAmount = Math.round(amount * 1.65);
                const discountPercent = Math.round(((originalAmount - amount) / originalAmount) * 100);
                const currentChosenSize = selectedSizes[pId] || item.selectedSize || "M";

                return (
                  <div
                    key={pId}
                    className="group relative flex flex-col bg-neutral-900/90 rounded-xl border border-neutral-800 hover:border-neutral-500 transition-all duration-300 overflow-hidden shadow-md hover:shadow-xl"
                  >
                    {/* Image with Myntra-style Top-Right ✕ Button */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-950">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={item.title}
                          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-neutral-600">
                          No Pic
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => onRemoveItem && onRemoveItem(item._id || item.id)}
                        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/70 backdrop-blur-xs text-neutral-300 hover:text-white hover:bg-rose-600 flex items-center justify-center transition-all cursor-pointer shadow-md"
                        title="Remove from wishlist"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>

                    {/* Product Details & Price */}
                    <div className="p-3.5 flex flex-col justify-between flex-1 gap-2 bg-neutral-900">
                      <div>
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest font-space block">
                          SNITCH
                        </span>
                        <h4
                          className="text-xs sm:text-sm font-bold text-neutral-200 truncate group-hover:text-white transition-colors font-display"
                          title={item.title}
                        >
                          {item.title}
                        </h4>
                      </div>

                      {/* Price Row */}
                      <div className="flex items-baseline gap-2 pt-0.5 flex-wrap">
                        <span className="text-sm sm:text-base font-black text-white font-space">
                          {formatPrice(amount, currency)}
                        </span>
                        <span className="text-[11px] text-neutral-500 line-through font-space">
                          {formatPrice(originalAmount, currency)}
                        </span>
                        <span className="text-[11px] font-black text-emerald-400 font-space">
                          ({discountPercent}% OFF)
                        </span>
                      </div>

                      {/* Size Selector */}
                      <div className="pt-1.5 border-t border-neutral-800">
                        <span className="text-[9px] font-black uppercase text-neutral-400 font-space block mb-1">
                          Select Size:
                        </span>
                        <div className="grid grid-cols-4 gap-1">
                          {availableSizes.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => handleSelectSize(pId, s)}
                              className={`py-1 rounded text-xs font-black border transition-all cursor-pointer text-center font-space ${
                                currentChosenSize === s
                                  ? "bg-white text-black border-white shadow"
                                  : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-600"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Move to Cart Button (Myntra Style) */}
                      <button
                        type="button"
                        onClick={() =>
                          onMoveToCart &&
                          onMoveToCart({
                            ...item,
                            selectedSize: currentChosenSize,
                          })
                        }
                        className="w-full mt-2 py-2.5 px-3 rounded-lg bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider cursor-pointer font-space transition-all shadow-md flex items-center justify-center gap-1.5 hover:scale-102"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="9" cy="21" r="1" />
                          <circle cx="20" cy="21" r="1" />
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                        <span>Move to Cart</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Move All to Cart */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 bg-neutral-900 border-t border-neutral-800 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-lg text-xs font-black uppercase tracking-wider text-neutral-300 hover:text-white border border-neutral-700 hover:border-white bg-neutral-950 transition-colors text-center font-space cursor-pointer flex-1"
            >
              ← Continue Shopping
            </button>

            <button
              type="button"
              onClick={() => {
                items.forEach((it) => {
                  const pId = getSafeId(it._id || it.id);
                  onMoveToCart &&
                    onMoveToCart({
                      ...it,
                      selectedSize: selectedSizes[pId] || it.selectedSize || "M",
                    });
                });
              }}
              className="py-3 px-6 rounded-lg bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider cursor-pointer font-space transition-colors text-center shadow-xl flex-1"
            >
              Move All to Cart ({items.length}) →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
