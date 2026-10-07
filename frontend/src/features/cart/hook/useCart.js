import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    addItem as addItemApi,
    getCartItems,
    updateCartItem as updateCartItemApi,
    removeCartItem as removeCartItemApi,
    clearCartApi,
    incrementQuantity,
    createCartOrder,
    getCartPaymentAggregation,
    verifyCartPayment,
    verifyCartOrder
} from "../services/cart.api";
import {
    setItems,
    addItem as addItemAction,
    removeItem as removeItemAction,
    updateQuantity as updateQuantityAction,
    clearCart as clearCartAction
} from "../state/cart.slice";
import { getSafeId } from "../../products/utils/formatters";

export const useCart = () => {
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth?.user);
    const cartItems = useSelector(state => state.cart?.items || []);

    // Load backend cart whenever user is authenticated or on initial load
    useEffect(() => {
        let isMounted = true;
        async function fetchBackendCart() {
            if (user) {
                const data = await getCartItems();
                if (isMounted && data?.cart?.items && Array.isArray(data.cart.items)) {
                    if (data.cart.items.length > 0) {
                        dispatch(setItems(data.cart.items));
                    }
                }
            }
        }
        fetchBackendCart();
        return () => {
            isMounted = false;
        };
    }, [user, dispatch]);

    async function handleAddItem({ productId, variantId, quantity = 1, product, selectedSize, price }) {
        const effectiveProductId = productId || getSafeId(product?._id || product?.id);
        const effectiveSize = selectedSize || product?.selectedSize || "M";

        const itemPayload = product ? {
            ...product,
            _id: effectiveProductId,
            id: effectiveProductId,
            variantId: variantId || product.variantId,
            selectedSize: effectiveSize,
            quantity,
        } : {
            _id: effectiveProductId,
            id: effectiveProductId,
            variantId,
            selectedSize: effectiveSize,
            quantity,
            price: price || { amount: 1499, currency: "INR" }
        };

        // 1. Instant Redux update for responsive UI
        dispatch(addItemAction(itemPayload));

        // 2. Sync to Backend database
        try {
            const res = await addItemApi({
                productId: effectiveProductId,
                variantId,
                quantity,
                product: itemPayload,
                selectedSize: effectiveSize,
                price: itemPayload.price
            });
            return res;
        } catch (err) {
            console.warn("Backend cart sync failed:", err?.message);
            return { success: false, error: err };
        }
    }

    async function handleGetCart() {
        try {
            const data = await getCartItems();
            if (data?.cart?.items) {
                dispatch(setItems(data.cart.items));
            }
            return data;
        } catch (err) {
            console.error("Failed to fetch cart from server", err);
            return null;
        }
    }

    async function handleIncrementCartItem({ productId, variantId, index }) {
        if (index !== undefined && cartItems[index]) {
            dispatch(updateQuantityAction({ index, quantity: (cartItems[index].quantity || 1) + 1 }));
        }
        if (productId) {
            try {
                await incrementQuantity({ productId, variantId });
            } catch (err) {
                console.error("Failed to increment on server:", err);
            }
        }
    }

    function handleRemoveItem(index) {
        const itemToRemove = cartItems[index];
        const productId = itemToRemove ? getSafeId(itemToRemove._id || itemToRemove.id || itemToRemove.product) : null;

        // 1. Redux instant removal
        dispatch(removeItemAction(index));

        // 2. Backend sync
        removeCartItemApi({ index, productId }).catch(() => {});
    }

    function handleUpdateQuantity(index, quantity, item) {
        // 1. Redux update
        dispatch(updateQuantityAction({ index, quantity, item }));

        // 2. Backend sync
        updateCartItemApi({
            index,
            quantity,
            selectedSize: item?.selectedSize || cartItems[index]?.selectedSize
        }).catch(() => {});
    }

    function handleClearCart() {
        // 1. Redux clear
        dispatch(clearCartAction());

        // 2. Backend sync
        clearCartApi().catch(() => {});
    }

    async function handleCreateCartOrder(payload) {
        const data = await createCartOrder(payload);
        if (data?.order) {
            return {
                ...data.order,
                keyId: data.keyId,
                order: data.order
            };
        }
        return data?.order || data || null;
    }

    async function handleVerifyCartPayment(payload) {
        const data = await verifyCartPayment(payload);
        return data;
    }

    async function handleGetPaymentAggregation({ couponCode = "" } = {}) {
        const data = await getCartPaymentAggregation({ couponCode });
        return data?.data || null;
    }

    async function handleVerifyCartOrder({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
        const data = await verifyCartOrder({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
        return data?.success || false;
    }

    return {
        cartItems,
        handleAddItem,
        handleGetCart,
        handleIncrementCartItem,
        handleRemoveItem,
        handleUpdateQuantity,
        handleClearCart,
        handleCreateCartOrder,
        handleVerifyCartPayment,
        handleGetPaymentAggregation,
        handleVerifyCartOrder
    };
};