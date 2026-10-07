import { Link } from "react-router";
import { formatPrice, getImageUrl, getItemImage, getSafeAmount, getSafeId } from "../utils/formatters";
import { useWishlist } from "../hooks/useWishlist";
import { CURATED_COLLECTION } from "../utils/curatedCollections";

export default function CartDrawer({
  isOpen,
  onClose,
  items = [],
  onRemoveItem,
  onUpdateQuantity,
}) {
  const { toggleWishlist, isWishlisted } = useWishlist();

  if (!isOpen) return null;

  let totalSellingPrice = 0;
  let totalMrp = 0;

  items.forEach((item) => {
    const price = getSafeAmount(item.price?.amount || item.price || 1499);
    const mrp = Number(item.mrp) || Math.round(price * 1.5) || 2999;
    const qty = Number(item.quantity) || 1;
    totalSellingPrice += price * qty;
    totalMrp += mrp * qty;
  });

  const totalCount = items.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);
  const currency = items[0]?.price?.currency || "INR";
  const mrpDiscount = Math.max(0, totalMrp - totalSellingPrice);

  const handleMoveToWishlist = (item, idx) => {
    const pId = getSafeId(item._id || item.id);
    toggleWishlist({
      ...item,
      _id: pId,
      id: pId,
    });
    if (onRemoveItem) onRemoveItem(idx);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Centered Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Spacious Center-Aligned Modal UI (Myntra/Flipkart Card Grid/List Standard) */}
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-neutral-950 border border-neutral-700/80 rounded-2xl text-white shadow-2xl z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shadow-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider font-brand">
                Shopping Bag
              </h2>
              <p className="text-[11px] text-neutral-400 font-space">
                {totalCount} {totalCount === 1 ? "item" : "items"} selected | Free Express Shipping
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-space font-bold transition-colors cursor-pointer flex items-center gap-1.5"
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

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
          {items.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-20 h-20 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-3xl text-neutral-400 mb-2 animate-float">
                🛍️
              </div>
              <h3 className="text-lg font-black text-white font-brand uppercase tracking-wider">
                Hey, your bag is empty!
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm font-body">
                Explore our curated drops, heavyweight streetwear, and luxury essentials.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-white text-black text-xs font-black uppercase tracking-wider rounded-lg hover:bg-neutral-200 cursor-pointer font-space transition-all shadow-xl hover:scale-105"
                >
                  ← Continue Shopping
                </button>
                <Link
                  to="/wishlist"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-neutral-900 border border-neutral-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-neutral-800 font-space transition-all"
                >
                  View Wishlist ❤️
                </Link>
              </div>
            </div>
          ) : (
            items.map((item, idx) => {
              const imgUrl = getItemImage(item, CURATED_COLLECTION);
              const price = getSafeAmount(item.price?.amount || item.price || 1499);
              const mrp = Number(item.mrp) || Math.round(price * 1.5) || 2999;
              const discountPct = Math.max(10, Math.round(((mrp - price) / mrp) * 100));
              const itemTotal = price * (item.quantity || 1);
              const maxStock = Number(item.stock || 10);
              const isMin = (item.quantity || 1) <= 1;
              const isMax = (item.quantity || 1) >= maxStock;
              const itemWishlisted = isWishlisted(item);

              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col gap-3 group shadow-md"
                >
                  {/* Top Part: Image, Info & Price */}
                  <div className="flex gap-3.5">
                    {/* Cover Thumbnail */}
                    <div className="w-20 sm:w-24 aspect-[3/4] bg-neutral-950 rounded-lg overflow-hidden flex-shrink-0 border border-neutral-800 relative">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={item.title || "Product"}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80";
                          }}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-600">
                          SNITCH
                        </div>
                      )}
                      <span className="absolute top-1 left-1 bg-black/80 text-[8px] font-black uppercase text-neutral-300 px-1.5 py-0.5 rounded">
                        {item.selectedSize || "M"}
                      </span>
                    </div>

                    {/* Information */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block font-space">
                          SNITCH
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate font-display">
                          {item.title}
                        </h4>
                        {item.selectedSize && (
                          <span className="text-[11px] text-neutral-400 font-space block mt-0.5">
                            Size: <strong className="text-white">{item.selectedSize}</strong>
                          </span>
                        )}
                        <span className="text-[10px] text-emerald-400 font-space block mt-0.5">
                          ✓ 7-Day Free Replacement
                        </span>
                      </div>

                      {/* Price breakdown */}
                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-sm font-black text-white font-space">
                          {formatPrice(itemTotal, currency)}
                        </span>
                        <span className="text-[11px] text-neutral-500 line-through font-space">
                          {formatPrice(mrp * (item.quantity || 1), currency)}
                        </span>
                        <span className="text-[9px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-900/60 px-1.5 py-0.2 rounded font-space uppercase">
                          {discountPct}% OFF
                        </span>
                      </div>

                      {/* Dynamic Price Difference Notice (Seller / Variant adjustment) */}
                      {(() => {
                        const displayPrice = item.displayPrice || item.product?.price || item.basePrice || item.price || { amount: 1499, currency: "INR" };
                        const variantPrice = item.variantPrice || item.price || item.product?.price || { amount: 1499, currency: "INR" };
                        const displayAmount = getSafeAmount(displayPrice?.amount !== undefined ? displayPrice.amount : displayPrice);
                        const variantAmount = getSafeAmount(variantPrice?.amount !== undefined ? variantPrice.amount : variantPrice);
                        const cur = displayPrice?.currency || item.price?.currency || "INR";

                        return displayAmount !== variantAmount && displayAmount > 0 && variantAmount > 0 && (
                          displayAmount > variantAmount ? (
                            <p className="text-[10px] uppercase tracking-[0.15em] mt-1.5 mb-2 text-green-600 font-bold font-space">
                              you will get this at {formatPrice(variantAmount, cur)}
                            </p>
                          ) : (
                            <p className="text-[10px] uppercase tracking-[0.15em] mt-1.5 mb-2 text-red-600 font-bold font-space">
                              warning this product will cost you {formatPrice(Math.abs(variantAmount - displayAmount), cur)} more.
                            </p>
                          )
                        );
                      })()}
                    </div>
                  </div>

                  {/* Bottom Actions Strip: Stepper, Move to Wishlist & Remove */}
                  <div className="pt-2.5 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2">
                    {/* Stepper */}
                    <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-700 rounded-lg p-0.5">
                      <button
                        type="button"
                        disabled={isMin}
                        onClick={() =>
                          onUpdateQuantity &&
                          !isMin &&
                          onUpdateQuantity(idx, (item.quantity || 1) - 1)
                        }
                        className={`w-6 h-6 flex items-center justify-center text-xs font-black rounded ${
                          isMin
                            ? "text-neutral-600 cursor-not-allowed opacity-40"
                            : "text-neutral-300 hover:text-white hover:bg-neutral-800 cursor-pointer"
                        }`}
                        title={isMin ? "Minimum quantity is 1" : "Decrease quantity"}
                      >
                        −
                      </button>
                      <span className="w-7 text-center text-xs font-black text-white font-space">
                        {item.quantity || 1}
                      </span>
                      <button
                        type="button"
                        disabled={isMax}
                        onClick={() =>
                          onUpdateQuantity &&
                          !isMax &&
                          onUpdateQuantity(idx, (item.quantity || 1) + 1)
                        }
                        className={`w-6 h-6 flex items-center justify-center text-xs font-black rounded ${
                          isMax
                            ? "text-neutral-600 cursor-not-allowed opacity-40"
                            : "text-neutral-300 hover:text-white hover:bg-neutral-800 cursor-pointer"
                        }`}
                        title={isMax ? `Maximum stock limit reached (${maxStock} available)` : "Increase quantity"}
                      >
                        +
                      </button>
                    </div>

                    {/* Move to Wishlist & Remove Button */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMoveToWishlist(item, idx)}
                        className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-rose-400 text-xs font-space font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Move to Wishlist"
                      >
                        <span className={itemWishlisted ? "text-rose-500" : "text-neutral-400"}>❤️</span>
                        <span>Wishlist</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onRemoveItem && onRemoveItem(idx)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-600 border border-rose-800/40 hover:border-rose-600 text-rose-400 hover:text-white text-xs font-space font-bold cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                        title="Remove item"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Price Summary & Checkout Action */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 bg-neutral-900 border-t border-neutral-800 space-y-3">
            <div className="flex justify-between items-baseline text-xs font-space">
              <div>
                <span className="text-neutral-400 uppercase font-bold tracking-wider block">Total Amount</span>
                {mrpDiscount > 0 && (
                  <span className="text-[10px] text-emerald-400 font-bold">
                    You save {formatPrice(mrpDiscount, currency)} on this order
                  </span>
                )}
              </div>
              <span className="text-xl font-black text-white font-space">
                {formatPrice(totalSellingPrice, currency)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="py-3 rounded-xl text-xs font-black uppercase tracking-wider text-neutral-300 hover:text-white border border-neutral-700 hover:border-white bg-neutral-950 transition-colors text-center font-space cursor-pointer"
              >
                ← Continue Shopping
              </button>

              <Link
                to="/cart"
                onClick={onClose}
                className="py-3 rounded-xl text-xs font-black uppercase tracking-wider text-black bg-white hover:bg-neutral-200 transition-all text-center font-space shadow-xl hover:scale-[1.02]"
              >
                Go to Bag / Checkout →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
