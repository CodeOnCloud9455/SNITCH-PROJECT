/* ─── Currency Symbol Formatter ─────────────────────────────── */
export function getCurrencySymbol(currency = "INR") {
  const code = (currency || "").toUpperCase();
  switch (code) {
    case "INR":
      return "₹";
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "JPY":
      return "¥";
    default:
      return code ? `${code} ` : "₹";
  }
}

/* ─── Safe Value & Image Extraction Helpers ─────────────────── */
export function getSafeAmount(amount) {
  if (amount === null || amount === undefined) return 0;
  if (typeof amount === "object") {
    if (amount.$numberInt !== undefined) return Number(amount.$numberInt) || 0;
    if (typeof amount.valueOf === "function") {
      const v = amount.valueOf();
      if (typeof v === "number") return v;
      if (typeof v === "string" && !isNaN(Number(v))) return Number(v);
    }
  }
  const num = Number(amount);
  return isNaN(num) ? 0 : num;
}

export function formatPrice(amount, currency = "INR") {
  const safe = getSafeAmount(amount);
  const symbol = getCurrencySymbol(typeof currency === "string" ? currency : "INR");
  return `${symbol}${safe.toLocaleString("en-IN")}`;
}

export function formateCurrency(amount, currency = "INR") {
  return formatPrice(amount, typeof currency === "string" ? currency : "INR");
}

export function getSafeId(id) {
  if (!id) return "";
  if (typeof id === "object") {
    return id.$oid || (typeof id.toString === "function" ? id.toString() : "");
  }
  return String(id);
}

export function getImageUrl(img) {
  if (!img) return "";
  if (Array.isArray(img)) {
    return getImageUrl(img[0]);
  }
  if (typeof img === "string") {
    const trimmed = img.trim();
    if (trimmed === "[object Object]" || trimmed === "") return "";
    return trimmed;
  }
  if (typeof img === "object") {
    return img.url || img.secure_url || img.src || "";
  }
  return "";
}

export function getItemImage(item, fallbackList = []) {
  if (!item) return "";
  
  // 1. Direct item properties
  const direct =
    getImageUrl(item.image) ||
    getImageUrl(item.images?.[0]) ||
    getImageUrl(item.images) ||
    getImageUrl(item.variantThumbnail) ||
    getImageUrl(item.product?.image) ||
    getImageUrl(item.product?.images?.[0]) ||
    getImageUrl(item.product?.images);

  if (direct && direct !== "[object Object]") {
    return direct;
  }

  // 2. Lookup in fallbackList (e.g. CURATED_COLLECTION)
  const itemId = getSafeId(item._id || item.id || item.product);
  if (Array.isArray(fallbackList) && itemId) {
    const matched = fallbackList.find((p) => getSafeId(p._id || p.id) === itemId);
    if (matched) {
      const rawVars = matched.variants || matched.varients || [];
      const varId = getSafeId(item.variantId || item.selectedVariant?._id || item.selectedVariant?.id);
      let matchedVar = rawVars.find((v) => getSafeId(v._id || v.id) === varId);

      const colorVal = item.selectedAttributes?.Color || item.selectedAttributes?.color;
      if (!matchedVar && colorVal) {
        const targetColor = String(colorVal).toLowerCase();
        matchedVar = rawVars.find((v) => {
          const c = v.attributes?.Color || v.attributes?.color;
          return c && String(c).toLowerCase() === targetColor;
        });
      }

      if (matchedVar && Array.isArray(matchedVar.images) && matchedVar.images.length > 0) {
        const vImg = getImageUrl(matchedVar.images[0]);
        if (vImg) return vImg;
      }

      const matchImg = getImageUrl(matched.images?.[0] || matched.image);
      if (matchImg) return matchImg;
    }
  }

  return "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80";
}
