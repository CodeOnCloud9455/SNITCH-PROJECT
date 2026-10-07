import axios from "axios";

const cartApiInstance = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL || ""}/api/cart`,
    withCredentials: true,
});

export const addItem = async ({ productId, variantId, quantity = 1, product, selectedSize, price }) => {
    try {
        const response = await cartApiInstance.post("/add", {
            productId,
            varientId: variantId,
            quantity,
            product,
            selectedSize: selectedSize || product?.selectedSize || "M",
            price: price || product?.price,
        });
        return response.data;
    } catch (err) {
        console.warn("Backend add item failed or offline:", err?.message);
        return { success: false, error: err };
    }
};

export const getCartItems = async () => {
    try {
        const response = await cartApiInstance.get("/");
        return response.data;
    } catch (err) {
        console.warn("Backend get cart failed or offline:", err?.message);
        return null;
    }
};

export const updateCartItem = async ({ index, quantity, selectedSize }) => {
    try {
        const response = await cartApiInstance.put("/update", {
            index,
            quantity,
            selectedSize,
        });
        return response.data;
    } catch (err) {
        console.warn("Backend update cart failed:", err?.message);
        return { success: false };
    }
};

export const removeCartItem = async ({ index, productId }) => {
    try {
        const response = await cartApiInstance.post("/remove", { index, productId });
        return response.data;
    } catch (err) {
        console.warn("Backend remove cart failed:", err?.message);
        return { success: false };
    }
};

export const clearCartApi = async () => {
    try {
        const response = await cartApiInstance.post("/clear");
        return response.data;
    } catch (err) {
        console.warn("Backend clear cart failed:", err?.message);
        return { success: false };
    }
};

export const incrementQuantity = async ({ productId, variantId }) => {
    try {
        const response = await cartApiInstance.patch(`/quantity/increment/${productId}/${variantId || ""}`);
        return response.data;
    } catch (err) {
        console.warn("Backend increment failed:", err?.message);
        return null;
    }
};

export const createCartOrder = async (payload = {}) => {
    try {
        const response = await cartApiInstance.post("/payment/create/order", payload);
        return response.data;
    } catch (err) {
        console.warn("Backend create order failed:", err?.response?.data?.message || err?.message);
        return { success: false, error: err?.response?.data || err };
    }
};

export const getCartPaymentAggregation = async ({ couponCode = "" } = {}) => {
    try {
        const response = await cartApiInstance.post("/payment/aggregation", { couponCode });
        return response.data;
    } catch (err) {
        console.warn("Backend payment aggregation failed:", err?.response?.data?.message || err?.message);
        return null;
    }
};

export const verifyCartPayment = async (payload) => {
    try {
        const response = await cartApiInstance.post("/payment/verify/order", payload);
        return response.data;
    } catch (err) {
        console.error("Backend verify payment failed:", err?.response?.data?.message || err?.message);
        return { success: false, error: err?.response?.data || err };
    }
};

export const verifyCartOrder = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
    try {
        const response = await cartApiInstance.post("/payment/verify/order", {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        });
        return response.data;
    } catch (err) {
        console.error("verifyCartOrder failed:", err?.response?.data?.message || err?.message);
        return { success: false, message: err?.response?.data?.message || err?.message };
    }
};

export const getUserOrdersApi = async () => {
    try {
        const response = await cartApiInstance.get("/orders");
        return response.data;
    } catch (err) {
        console.warn("getUserOrdersApi failed:", err?.response?.data?.message || err?.message);
        return { success: false, orders: [] };
    }
};

export const getOrderByIdApi = async (orderId) => {
    try {
        const response = await cartApiInstance.get(`/orders/${orderId}`);
        return response.data;
    } catch (err) {
        console.warn("getOrderByIdApi failed:", err?.response?.data?.message || err?.message);
        return { success: false, order: null };
    }
};

export const cancelOrderApi = async (orderId, { reason, comment }) => {
    try {
        const response = await cartApiInstance.post(`/orders/${orderId}/cancel`, { reason, comment });
        return response.data;
    } catch (err) {
        console.warn("cancelOrderApi failed:", err?.response?.data?.message || err?.message);
        return { success: false, message: err?.response?.data?.message || err?.message };
    }
};

export const returnOrderApi = async (orderId, payload) => {
    try {
        const response = await cartApiInstance.post(`/orders/${orderId}/return`, payload);
        return response.data;
    } catch (err) {
        console.warn("returnOrderApi failed:", err?.response?.data?.message || err?.message);
        return { success: false, message: err?.response?.data?.message || err?.message };
    }
};
