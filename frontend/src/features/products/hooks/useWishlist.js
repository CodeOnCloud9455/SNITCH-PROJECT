import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { getSafeId } from "../utils/formatters";
import {
  getWishlistApi,
  toggleWishlistApi,
  removeFromWishlistApi,
  clearWishlistApi
} from "../services/wishlist.api";

const WISHLIST_STORAGE_KEY = "snitch_user_wishlist";

export function useWishlist() {
  const user = useSelector((state) => state.auth?.user);

  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Keep state synchronized with storage and cross-window/cross-component changes
  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
        setWishlistItems(saved ? JSON.parse(saved) : []);
      } catch {
        setWishlistItems([]);
      }
    };

    window.addEventListener("snitch_wishlist_updated", handleStorage);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("snitch_wishlist_updated", handleStorage);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Sync with backend on user login or mount
  useEffect(() => {
    let isMounted = true;
    async function syncBackendWishlist() {
      if (user) {
        const data = await getWishlistApi();
        if (isMounted && data?.wishlist?.items && Array.isArray(data.wishlist.items)) {
          if (data.wishlist.items.length > 0) {
            saveWishlist(data.wishlist.items);
          }
        }
      }
    }
    syncBackendWishlist();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const saveWishlist = (items) => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
      setWishlistItems(items);
      window.dispatchEvent(new Event("snitch_wishlist_updated"));
    } catch (e) {
      console.error("Failed to save wishlist", e);
    }
  };

  const isWishlisted = useCallback(
    (product) => {
      if (!product) return false;
      const targetId = getSafeId(product._id || product.id);
      return wishlistItems.some((item) => getSafeId(item._id || item.id || item.product) === targetId);
    },
    [wishlistItems]
  );

  const toggleWishlist = useCallback(
    (product) => {
      if (!product) return false;
      const targetId = getSafeId(product._id || product.id);
      const exists = wishlistItems.some((item) => getSafeId(item._id || item.id || item.product) === targetId);

      let next;
      if (exists) {
        next = wishlistItems.filter((item) => getSafeId(item._id || item.id || item.product) !== targetId);
      } else {
        next = [product, ...wishlistItems];
      }

      saveWishlist(next);

      // Async backend sync
      toggleWishlistApi(product).catch(() => {});

      return !exists;
    },
    [wishlistItems]
  );

  const removeFromWishlist = useCallback(
    (productId) => {
      const targetId = getSafeId(productId);
      const next = wishlistItems.filter((item) => getSafeId(item._id || item.id || item.product) !== targetId);
      saveWishlist(next);

      // Async backend sync
      removeFromWishlistApi(targetId).catch(() => {});
    },
    [wishlistItems]
  );

  const clearWishlist = useCallback(() => {
    saveWishlist([]);

    // Async backend sync
    clearWishlistApi().catch(() => {});
  }, []);

  return {
    wishlistItems,
    wishlistCount: wishlistItems.length,
    isWishlisted,
    toggleWishlist,
    removeFromWishlist,
    clearWishlist,
  };
}
