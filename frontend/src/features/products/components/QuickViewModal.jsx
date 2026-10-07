import { useState, useEffect, useMemo } from "react";
import { formatPrice, getImageUrl } from "../utils/formatters";

function getAttributeEntries(attrs) {
  if (!attrs) return [];
  if (attrs instanceof Map) return Array.from(attrs.entries());
  if (typeof attrs === "object") return Object.entries(attrs);
  return [];
}

export default function QuickViewModal({ product, isOpen, onClose, onAddToCart }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  const rawVariants = useMemo(() => {
    if (!product || !Array.isArray(product.variants || product.varients)) return [];
    return product.variants || product.varients || [];
  }, [product]);

  const allAttributeKeys = useMemo(() => {
    if (rawVariants.length === 0) return [];
    const keysSet = new Set();
    rawVariants.forEach((v) => {
      const entries = getAttributeEntries(v.attributes);
      entries.forEach(([k]) => {
        if (k && String(k).trim()) keysSet.add(String(k).trim());
      });
    });
    return Array.from(keysSet);
  }, [rawVariants]);

  const attributeValuesMap = useMemo(() => {
    const map = {};
    allAttributeKeys.forEach((key) => {
      const valSet = new Set();
      rawVariants.forEach((v) => {
        const entries = getAttributeEntries(v.attributes);
        const match = entries.find(([k]) => k.toLowerCase() === key.toLowerCase());
        if (match && match[1] !== undefined && match[1] !== null && String(match[1]).trim() !== "") {
          valSet.add(String(match[1]).trim());
        }
      });
      map[key] = Array.from(valSet);
    });
    return map;
  }, [allAttributeKeys, rawVariants]);

  useEffect(() => {
    setSelectedImageIndex(0);
    setQuantity(1);
    setAddedToast(false);

    if (rawVariants.length > 0) {
      const initialVariant = rawVariants.find((v) => (Number(v.stock) || 0) > 0) || rawVariants[0];
      if (initialVariant) {
        const initAttrs = {};
        getAttributeEntries(initialVariant.attributes).forEach(([k, val]) => {
          initAttrs[k] = val;
        });
        setSelectedAttributes(initAttrs);
      }
    } else {
      setSelectedAttributes({});
    }
  }, [product, rawVariants]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const matchedVariant = useMemo(() => {
    if (rawVariants.length === 0) return null;
    return (
      rawVariants.find((v) => {
        const entries = getAttributeEntries(v.attributes);
        for (const key of allAttributeKeys) {
          const expectedVal = selectedAttributes[key];
          if (!expectedVal) return false;
          const match = entries.find(([k]) => k.toLowerCase() === key.toLowerCase());
          if (!match || String(match[1]).trim() !== String(expectedVal).trim()) {
            return false;
          }
        }
        return true;
      }) || null
    );
  }, [allAttributeKeys, selectedAttributes, rawVariants]);

  const currentPriceAmount = useMemo(() => {
    if (matchedVariant?.price?.amount !== undefined && matchedVariant?.price?.amount !== null) {
      return Number(matchedVariant.price.amount) || 0;
    }
    return Number(product?.price?.amount || product?.price) || 1499;
  }, [matchedVariant, product]);

  const currentPriceCurrency = useMemo(() => {
    return matchedVariant?.price?.currency || product?.price?.currency || "INR";
  }, [matchedVariant, product]);

  const currentStockCount = useMemo(() => {
    if (matchedVariant) {
      return Number(matchedVariant.stock) || 0;
    }
    return Number(product?.stock) || 10;
  }, [matchedVariant, product]);

  const images = useMemo(() => {
    // 1. Direct matched variant images
    if (matchedVariant && Array.isArray(matchedVariant.images) && matchedVariant.images.length > 0) {
      const valid = matchedVariant.images.map(getImageUrl).filter(Boolean);
      if (valid.length > 0) return valid;
    }

    // 2. Same color variant images
    const colorKey = allAttributeKeys.find((k) => k.toLowerCase() === "color" || k.toLowerCase() === "colour");
    const activeColor = colorKey ? selectedAttributes[colorKey] : null;
    if (activeColor) {
      const sameColorVariant = rawVariants.find((v) => {
        const entries = getAttributeEntries(v.attributes);
        const match = entries.find(([k]) => k.toLowerCase() === "color" || k.toLowerCase() === "colour");
        return match && String(match[1]).toLowerCase() === String(activeColor).toLowerCase() && Array.isArray(v.images) && v.images.length > 0;
      });
      if (sameColorVariant) {
        const valid = sameColorVariant.images.map(getImageUrl).filter(Boolean);
        if (valid.length > 0) return valid;
      }
    }

    // 3. Fallback to product images
    if (product && Array.isArray(product.images) && product.images.length > 0) {
      const valid = product.images.map(getImageUrl).filter(Boolean);
      if (valid.length > 0) return valid;
    }

    return [];
  }, [matchedVariant, selectedAttributes, allAttributeKeys, rawVariants, product]);

  if (!isOpen || !product) return null;

  const currentImgUrl = getImageUrl(images[selectedImageIndex] || images[0]);
  const formattedPrice = formatPrice(currentPriceAmount, currentPriceCurrency);

  const handleAttributeSelect = (key, val) => {
    const updatedAttrs = {
      ...selectedAttributes,
      [key]: val,
    };

    // Check if an exact variant exists with all updated attributes
    const exactMatch = rawVariants.find((v) => {
      const entries = getAttributeEntries(v.attributes);
      for (const [k, vVal] of Object.entries(updatedAttrs)) {
        const match = entries.find(([attrK]) => attrK.toLowerCase() === k.toLowerCase());
        if (!match || String(match[1]).trim() !== String(vVal).trim()) return false;
      }
      return true;
    });

    if (exactMatch) {
      const fullAttrs = {};
      getAttributeEntries(exactMatch.attributes).forEach(([k, vVal]) => {
        fullAttrs[k] = vVal;
      });
      setSelectedAttributes(fullAttrs);
    } else {
      // Find another variant having this newly chosen attribute (e.g. newly picked Color)
      const fallbackVariant = rawVariants.find((v) => {
        const entries = getAttributeEntries(v.attributes);
        const match = entries.find(([attrK]) => attrK.toLowerCase() === key.toLowerCase());
        return match && String(match[1]).trim() === String(val).trim();
      });

      if (fallbackVariant) {
        const fallbackAttrs = {};
        getAttributeEntries(fallbackVariant.attributes).forEach(([k, vVal]) => {
          fallbackAttrs[k] = vVal;
        });
        setSelectedAttributes(fallbackAttrs);
      } else {
        setSelectedAttributes(updatedAttrs);
      }
    }

    setSelectedImageIndex(0);
  };

  const handleAdd = () => {
    if (onAddToCart) {
      const baseDisplayPrice = product.price || { amount: currentPriceAmount, currency: currentPriceCurrency };
      const matchedVariantPrice = { amount: currentPriceAmount, currency: currentPriceCurrency };

      onAddToCart({
        ...product,
        selectedSize: selectedAttributes?.Size || selectedAttributes?.size || "M",
        selectedAttributes,
        quantity,
        displayPrice: baseDisplayPrice,
        variantPrice: matchedVariantPrice,
        price: matchedVariantPrice,
        stock: currentStockCount,
        variantId: matchedVariant?._id || matchedVariant?.id || rawVariants?.[0]?._id,
      });
    }
    setAddedToast(true);
    setTimeout(() => {
      setAddedToast(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-xl bg-neutral-900 border border-neutral-800 text-white overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-white bg-neutral-800 text-xs cursor-pointer hover:bg-neutral-700 transition-colors"
        >
          ✕
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 sm:p-6 max-h-[85vh] overflow-y-auto">
          {/* Image Column */}
          <div className="flex flex-col gap-2">
            <div className="aspect-[3/4] rounded-lg bg-neutral-950 overflow-hidden border border-neutral-800 flex items-center justify-center">
              {currentImgUrl ? (
                <img
                  src={currentImgUrl}
                  alt={product.title}
                  className="w-full h-full object-cover object-top transition-all duration-300"
                />
              ) : (
                <span className="text-xs text-neutral-600">No Image Available</span>
              )}
            </div>

            {/* Thumbnail selector if multiple images for this variant */}
            {images.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-12 h-16 rounded overflow-hidden border transition-all cursor-pointer flex-shrink-0 ${
                      selectedImageIndex === idx ? "border-white scale-105" : "border-neutral-800 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={getImageUrl(img)} alt="Thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details & Attributes Column */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest font-space block mb-1">
                SNITCH
              </span>
              <h2 className="text-lg font-bold text-white mb-2 leading-snug font-display">
                {product.title}
              </h2>
              
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-xl font-black text-white font-space">
                  {formattedPrice}
                </span>
                <span className="text-xs text-neutral-500 line-through font-space">
                  {formatPrice(Math.round(currentPriceAmount * 1.65), currentPriceCurrency)}
                </span>
                <span className="text-[10px] font-black text-emerald-400 font-space bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                  40% OFF
                </span>
              </div>

              <p className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                {product.description || "Everyday luxury streetwear crafted with precision."}
              </p>

              {/* Dynamic Variant Attributes (Color, Size, etc.) */}
              <div className="space-y-3 mt-4">
                {allAttributeKeys.map((key) => {
                  const vals = attributeValuesMap[key] || [];
                  const selectedVal = selectedAttributes[key];
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-300 font-space">{key}:</span>
                        <span className="font-black text-white font-space text-[11px]">{selectedVal || "Select"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {vals.map((v) => {
                          const isSelected = selectedVal === v;
                          return (
                            <button
                              key={v}
                              type="button"
                              onClick={() => handleAttributeSelect(key, v)}
                              className={`px-2.5 py-1 rounded text-xs font-bold border transition-all cursor-pointer font-space ${
                                isSelected
                                  ? "bg-white text-black border-white shadow-md scale-102"
                                  : "bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-500"
                              }`}
                            >
                              {v}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Stock status indicator */}
              <div className="mt-3 flex items-center justify-between text-[11px] font-space text-neutral-400">
                <span>Stock:</span>
                <span className={currentStockCount > 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {currentStockCount > 0 ? `${currentStockCount} units in stock` : "Out of Stock"}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800">
              <button
                type="button"
                disabled={currentStockCount <= 0}
                onClick={handleAdd}
                className={`w-full py-3 rounded-lg font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer text-center font-space shadow-md disabled:opacity-40 disabled:cursor-not-allowed ${
                  addedToast
                    ? "bg-emerald-500 text-black font-black"
                    : "bg-white text-black hover:bg-neutral-200 active:scale-98"
                }`}
              >
                {addedToast ? "✓ Added to Cart" : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
