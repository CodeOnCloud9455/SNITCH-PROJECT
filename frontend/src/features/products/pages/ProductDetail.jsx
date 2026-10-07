import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useSelector } from "react-redux";
import { useProduct } from "../hooks/useProduct";
import CartDrawer from "../components/CartDrawer";
import { formatPrice, getImageUrl, getSafeId } from "../utils/formatters";
import { useCart } from "../../cart/hook/useCart";

function getAttributeEntries(attrs) {
  if (!attrs) return [];
  if (attrs instanceof Map) return Array.from(attrs.entries());
  if (typeof attrs === "object") return Object.entries(attrs);
  return [];
}

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { handleGetProductById } = useProduct();
  const { handleAddItem, handleRemoveItem, handleUpdateQuantity, cartItems } = useCart();

  const reduxProduct = useSelector((state) => state.product?.product);
  const loading = useSelector((state) => state.product?.loading);
  const [localProduct, setLocalProduct] = useState(null);

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    if (productId) {
      handleGetProductById(productId).then((res) => {
        if (res) setLocalProduct(res);
      });
      window.scrollTo(0, 0);
    }
  }, [productId]);

  const product = (reduxProduct && getSafeId(reduxProduct._id || reduxProduct.id) === getSafeId(productId))
    ? reduxProduct
    : localProduct;

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
  }, [rawVariants]);

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
    return Number(product?.price?.amount) || 0;
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

    // 2. Fallback to any variant with the same Color if matched variant has no direct images
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

    // 3. Product-level fallback
    if (product && Array.isArray(product.images) && product.images.length > 0) {
      const valid = product.images.map(getImageUrl).filter(Boolean);
      if (valid.length > 0) return valid;
    }

    return [];
  }, [matchedVariant, selectedAttributes, allAttributeKeys, rawVariants, product]);

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

    setSelectedImageIdx(0);
  };

  const handleAddToCart = () => {
    if (!product) return;
    const pId = getSafeId(product._id || product.id || productId);
    const variantId = matchedVariant?._id || matchedVariant?.id || rawVariants?.[0]?._id;

    handleAddItem({
      productId: pId,
      variantId,
      quantity,
      product: {
        ...product,
        _id: pId,
        id: pId,
        variantId,
        selectedSize: selectedAttributes?.Size || selectedAttributes?.size || "M",
        displayPrice: product.price || { amount: currentPriceAmount, currency: currentPriceCurrency },
        variantPrice: { amount: currentPriceAmount, currency: currentPriceCurrency },
        price: { amount: currentPriceAmount, currency: currentPriceCurrency },
        quantity,
        selectedAttributes,
        stock: currentStockCount,
      },
    });

    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
    setCartOpen(true);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/cart");
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
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Product Not Found</h2>
        <Link to="/" className="text-xs uppercase font-bold underline text-neutral-400 hover:text-white">
          Return to Store
        </Link>
      </div>
    );
  }

  const mainImageUrl = getImageUrl(images[selectedImageIdx] || images[0]);

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      {/* ─── Breadcrumb ─── */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-4 text-xs text-neutral-400 flex items-center gap-2">
        <Link to="/" className="hover:text-white transition-colors">Home</Link>
        <span>/</span>
        <span className="text-white truncate">{product.title}</span>
      </div>

      {/* ─── Product Detail Main Content ─── */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 pb-16 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left Column: Image Stage */}
          <div className="flex flex-col gap-3">
            <div className="aspect-[3/4] w-full bg-neutral-900 rounded-md overflow-hidden border border-neutral-800 flex items-center justify-center">
              {mainImageUrl ? (
                <img
                  src={mainImageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <span className="text-xs text-neutral-500">No Image Available</span>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-14 h-18 rounded overflow-hidden border transition-all cursor-pointer flex-shrink-0 ${
                      selectedImageIdx === idx ? "border-white" : "border-neutral-800 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Information & Actions */}
          <div className="flex flex-col gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                SNITCH
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                {product.title}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3 my-3">
                <span className="text-2xl font-black text-white">
                  {formatPrice(currentPriceAmount, currentPriceCurrency)}
                </span>
                <span className="text-xs text-neutral-500 line-through">
                  {formatPrice(Math.round(currentPriceAmount * 1.8), currentPriceCurrency)}
                </span>
                <span className="text-xs font-bold text-white bg-neutral-800 px-2 py-0.5 rounded">
                  45% OFF
                </span>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed">
                {product.description || "Premium garment tailored for modern luxury and everyday comfort."}
              </p>
            </div>

            {/* Dynamic Attributes (e.g. Color, Size) */}
            {allAttributeKeys.map((key) => {
              const vals = attributeValuesMap[key] || [];
              const selectedVal = selectedAttributes[key];
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-300">{key}:</span>
                    <span className="font-bold text-white">{selectedVal || "Select"}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {vals.map((v) => {
                      const isSelected = selectedVal === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => handleAttributeSelect(key, v)}
                          className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-white text-black border-white"
                              : "bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-600"
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

            {/* Quantity Selector & Stock Status */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">Qty:</span>
                <div className="flex items-center border border-neutral-800 rounded bg-neutral-900">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-2.5 py-1 text-neutral-400 hover:text-white cursor-pointer text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <span className="px-2 text-xs font-bold text-white">{quantity}</span>
                  <button
                    type="button"
                    disabled={quantity >= currentStockCount}
                    onClick={() => setQuantity(Math.min(currentStockCount, quantity + 1))}
                    className={`px-2.5 py-1 text-xs font-bold transition-colors ${
                      quantity >= currentStockCount
                        ? "text-neutral-600 cursor-not-allowed opacity-40"
                        : "text-neutral-400 hover:text-white cursor-pointer"
                    }`}
                    title={quantity >= currentStockCount ? `Maximum stock limit reached (${currentStockCount} available)` : "Increase quantity"}
                  >
                    +
                  </button>
                </div>
              </div>

              <span className={`text-xs font-semibold ${currentStockCount > 0 ? "text-neutral-400" : "text-rose-400"}`}>
                {currentStockCount > 0 ? `${currentStockCount} units available` : "Out of Stock"}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={currentStockCount <= 0}
                onClick={handleAddToCart}
                className="py-3 px-4 rounded bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-center"
              >
                {addedToast ? "✓ Added to Cart" : "Add to Cart"}
              </button>

              <button
                type="button"
                disabled={currentStockCount <= 0}
                onClick={handleBuyNow}
                className="py-3 px-4 rounded border border-neutral-700 bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-center"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Cart Drawer ─── */}
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
