import axios from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const wishlistApiInstance = axios.create({
    baseURL: `${API_BASE_URL}/api/wishlist`,
    withCredentials: true,
});

export const getWishlistApi = async () => {
    try {
        const response = await wishlistApiInstance.get("/");
        return response.data;
    } catch (err) {
        console.warn("Backend get wishlist failed or offline:", err?.message);
        return null;
    }
};

export const toggleWishlistApi = async (product) => {
    try {
        const response = await wishlistApiInstance.post("/toggle", {
            product,
            productId: product?._id || product?.id,
        });
        return response.data;
    } catch (err) {
        console.warn("Backend toggle wishlist failed or offline:", err?.message);
        return null;
    }
};

export const removeFromWishlistApi = async (productId) => {
    try {
        const response = await wishlistApiInstance.delete(`/remove/${productId}`);
        return response.data;
    } catch (err) {
        console.warn("Backend remove wishlist failed or offline:", err?.message);
        return null;
    }
};

export const clearWishlistApi = async () => {
    try {
        const response = await wishlistApiInstance.delete("/clear");
        return response.data;
    } catch (err) {
        console.warn("Backend clear wishlist failed or offline:", err?.message);
        return null;
    }
};
