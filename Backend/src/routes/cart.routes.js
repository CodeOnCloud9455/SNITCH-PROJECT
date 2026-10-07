import express from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import {
    addToCart,
    getCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
    incrementCartItemQuantity,
    createOrderController,
    getCartPaymentAggregation,
    verifyOrderController,
    getUserOrders,
    getOrderById,
    cancelOrderController,
    returnOrderController
} from "../controllers/cart.controller.js";

const router = express.Router();

// User Orders history, cancel and return
router.get("/orders", authenticateUser, getUserOrders);
router.get("/orders/:orderId", authenticateUser, getOrderById);
router.post("/orders/:orderId/cancel", authenticateUser, cancelOrderController);
router.put("/orders/:orderId/cancel", authenticateUser, cancelOrderController);
router.post("/orders/:orderId/return", authenticateUser, returnOrderController);
router.put("/orders/:orderId/return", authenticateUser, returnOrderController);

router.post("/add", authenticateUser, addToCart);
router.post("/add/:productId", authenticateUser, addToCart);
router.post("/add/:productId/:varientId", authenticateUser, addToCart);

router.get("/", authenticateUser, getCart);

router.put("/update", authenticateUser, updateCartItemQuantity);
router.patch("/update", authenticateUser, updateCartItemQuantity);

router.post("/remove", authenticateUser, removeCartItem);
router.delete("/remove", authenticateUser, removeCartItem);

router.post("/clear", authenticateUser, clearCart);
router.delete("/clear", authenticateUser, clearCart);

router.patch("/quantity/increment/:productId/:varientId", authenticateUser, incrementCartItemQuantity);

// Aggregation Pipeline for calculating dynamic payments & costs based on active cart
router.get("/payment/aggregation", authenticateUser, getCartPaymentAggregation);
router.post("/payment/aggregation", authenticateUser, getCartPaymentAggregation);

router.post("/payment/create/order", authenticateUser, createOrderController);

router.post("/payment/verify/order", authenticateUser, verifyOrderController );
export default router;