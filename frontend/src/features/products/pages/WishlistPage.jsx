import { useState } from "react";
import { Link } from "react-router";
import { useWishlist } from "../hooks/useWishlist";
import { useCart } from "../../cart/hook/useCart";
import { formatPrice, getImageUrl, getSafeId } from "../utils/formatters";
import CartDrawer from "../components/CartDrawer";

export default function WishlistPage() {
  const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();
  const { handleAddItem, handleRemoveItem, handleUpdateQuantity, cartItems } = useCart();
  const [selectedSizes, setSelectedSizes] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  const availableSizes = ["S", "M", "L", "XL"];

  const handleSelectSize = (itemId, size) => {
    setSelectedSizes((prev) => ({
      ...prev,
      [itemId]: size,
    }));
  };

  const handleMoveToCart = (item) => {
    const pId = getSafeId(item._id || item.id);
    const chosenSize = selectedSizes[pId] || item.selectedSize || "M";
    const variantId = item.variants?.[0]?._id || item.varients?.[0]?._id;

    handleAddItem({
      productId: pId,
      variantId,
      quantity: 1,
      product: {
        ...item,
        _id: pId,
        id: pId,
        selectedSize: chosenSize,
        quantity: 1,
      },
    });

    removeFromWishlist(pId);
    showToast(`Moved "${item.title || "Item"}" (${chosenSize}) to Cart! 🛍️`);
    setCartOpen(true);
  };

  const handleMoveAllToCart = () => {
    wishlistItems.forEach((item) => {
      const pId = getSafeId(item._id || item.id);
      const chosenSize = selectedSizes[pId] || item.selectedSize || "M";
      const variantId = item.variants?.[0]?._id || item.varients?.[0]?._id;

      handleAddItem({
        productId: pId,
        variantId,
        quantity: 1,
        product: {
          ...item,
          _id: pId,
          id: pId,
          selectedSize: chosenSize,
          quantity: 1,
        },
      });
    });

    clearWishlist();
    showToast(`Moved all ${wishlistItems.length} items to Cart! 🛍️`);
    setCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col selection:bg-white selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white text-black px-4 py-2.5 rounded-md shadow-2xl font-bold text-xs flex items-center gap-2 border border-neutral-300 animate-bounce">
          <span className="text-sm">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Header (Myntra Style) */}
        <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b border-neutral-800 gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider font-brand">
              My Wishlist
            </h1>
            <span className="px-3 py-0.5 rounded-full text-xs font-black bg-neutral-900 text-neutral-300 border border-neutral-700 font-space">
              {wishlistItems.length} {wishlistItems.length === 1 ? "ITEM" : "ITEMS"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="px-4 py-2 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white text-xs font-space font-bold transition-all flex items-center gap-1.5"
            >
              <span>← Continue Shopping</span>
            </Link>

            {wishlistItems.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleMoveAllToCart}
                  className="px-4 py-2 rounded-md bg-white hover:bg-neutral-200 text-black text-xs font-black uppercase tracking-wider transition-all font-space shadow-md cursor-pointer"
                >
                  Move All to Cart
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to clear your wishlist?")) {
                      clearWishlist();
                      showToast("Wishlist cleared");
                    }
                  }}
                  className="text-xs text-neutral-400 hover:text-rose-400 underline font-space cursor-pointer"
                >
                  Clear All
                </button>
              </>
            )}
          </div>
        </div>

        {/* Wishlist Items Grid (Myntra & Flipkart Style) */}
        {wishlistItems.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center bg-neutral-950 border border-neutral-800 rounded-2xl p-8 space-y-4 max-w-lg mx-auto shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-3xl text-rose-500/80 mb-2">
              🤍
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white uppercase font-brand tracking-wider">
              YOUR WISHLIST IS EMPTY
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-body">
              Explore more and shortlist some items you like by tapping the heart icon.
            </p>
            <Link
              to="/"
              className="px-8 py-3.5 bg-white text-black font-black text-xs uppercase tracking-wider rounded-md hover:bg-neutral-200 cursor-pointer font-space transition-all shadow-xl hover:scale-105 inline-block mt-2"
            >
              Continue Shopping →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
            {wishlistItems.map((item, idx) => {
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
                  className="group relative flex flex-col bg-neutral-900/90 rounded-xl border border-neutral-800 hover:border-neutral-500 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl"
                >
                  {/* Image Container with Cross Button */}
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

                    {/* Remove ✕ Button at Top-Right (Myntra Style) */}
                    <button
                      type="button"
                      onClick={() => {
                        removeFromWishlist(pId);
                        showToast(`Removed "${item.title || "Item"}" from Wishlist`);
                      }}
                      className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/75 backdrop-blur-xs text-neutral-300 hover:text-white hover:bg-rose-600 flex items-center justify-center transition-all cursor-pointer shadow-md"
                      title="Remove from wishlist"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  {/* Product Details */}
                  <div className="p-2.5 sm:p-3.5 flex flex-col justify-between flex-1 gap-1.5 sm:gap-2 bg-neutral-900">
                    <div>
                      <span className="text-[9px] sm:text-[10px] font-black text-neutral-400 uppercase tracking-widest font-space block">
                        SNITCH
                      </span>
                      <h3
                        className="text-xs sm:text-sm font-bold text-neutral-200 truncate group-hover:text-white transition-colors font-display"
                        title={item.title}
                      >
                        {item.title || "Product"}
                      </h3>
                    </div>

                    {/* Price Row (Flipkart / Myntra Style) */}
                    <div className="flex items-baseline gap-1.5 sm:gap-2 pt-0.5 flex-wrap">
                      <span className="text-xs sm:text-base font-black text-white font-space">
                        {formatPrice(amount, currency)}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-neutral-500 line-through font-space">
                        {formatPrice(originalAmount, currency)}
                      </span>
                      <span className="text-[9px] sm:text-[11px] font-black text-emerald-400 font-space">
                        ({discountPercent}% OFF)
                      </span>
                    </div>

                    {/* Size Selector Chips */}
                    <div className="pt-1.5 border-t border-neutral-800">
                      <span className="text-[8px] sm:text-[9px] font-black uppercase text-neutral-400 font-space block mb-1">
                        Select Size:
                      </span>
                      <div className="grid grid-cols-4 gap-1">
                        {availableSizes.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleSelectSize(pId, s)}
                            className={`py-1 rounded text-[10px] sm:text-xs font-black border transition-all cursor-pointer text-center font-space ${
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

                    {/* Move to Cart Full-Width Button (Myntra Style) */}
                    <button
                      type="button"
                      onClick={() => handleMoveToCart(item)}
                      className="w-full mt-1.5 sm:mt-2 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg bg-white hover:bg-neutral-200 text-black font-black text-[11px] sm:text-xs uppercase tracking-wider cursor-pointer font-space transition-all shadow-md flex items-center justify-center gap-1.5 hover:scale-102"
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
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onRemoveItem={handleRemoveItem}
        onUpdateQuantity={handleUpdateQuantity}
      />
    </div>
  );
}
