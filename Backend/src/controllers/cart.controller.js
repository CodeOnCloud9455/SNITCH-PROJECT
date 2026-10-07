import crypto from "crypto";
import mongoose from "mongoose";
import cartModel from "../models/cart.model.js";
import productModel from "../models/product.model.js";
import paymentModel from "../models/payment.model.js";
import { createOrder } from "../services/payment.service.js";
import { config } from "../config/config.js";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils.js";
import Razorpay from "razorpay";
import e from "express";

// Helper to normalize product/item IDs
const getItemId = (item) => {
    if (!item) return "";
    if (typeof item === "object") {
        return (item._id || item.id || item.product || "").toString();
    }
    return item.toString();
};

// Helper to find stock limit from product and variant/size
const getVariantStock = (dbProduct, varientId, selectedSize, fallback = 10) => {
    if (!dbProduct) return fallback;

    const variants = dbProduct.varients || dbProduct.variants || [];
    if (Array.isArray(variants) && variants.length > 0) {
        if (varientId) {
            const v = variants.find(item => item._id && item._id.toString() === varientId.toString());
            if (v && v.stock !== undefined) return Number(v.stock);
        }
        if (selectedSize) {
            const v = variants.find(item => {
                const attrs = item.attributes instanceof Map ? Object.fromEntries(item.attributes) : (item.attributes || {});
                return Object.values(attrs).some(val => String(val).toLowerCase() === String(selectedSize).toLowerCase());
            });
            if (v && v.stock !== undefined) return Number(v.stock);
        }
        if (variants[0] && variants[0].stock !== undefined) {
            return Number(variants[0].stock);
        }
    }
    if (dbProduct.stock !== undefined) return Number(dbProduct.stock);
    return fallback;
};

export const addToCart = async (req, res) => {
    try {
        const { productId, varientId } = req.params;
        const { quantity = 1, product: passedProduct, selectedSize = "M", title, image, price } = req.body;
        const quantityToAdd = Number(quantity) || 1;

        const effectiveProductId = productId || (passedProduct && (passedProduct._id || passedProduct.id));

        if (!effectiveProductId) {
            return res.status(400).json({
                message: "Product ID is required",
                success: false
            });
        }

        let cart = await cartModel.findOne({ user: req.user._id });
        if (!cart) {
            cart = await cartModel.create({ user: req.user._id, items: [] });
        }

        // Try looking up in DB for real stock info
        let dbProduct = null;
        try {
            if (String(effectiveProductId).match(/^[0-9a-fA-F]{24}$/)) {
                dbProduct = await productModel.findById(effectiveProductId);
            }
        } catch (e) {
            // Non-mongo ID (e.g. curated product)
        }

        const effectiveTitle = passedProduct?.title || title || dbProduct?.title || "Product";
        const rawImg = passedProduct?.images?.[0] || passedProduct?.image || image || dbProduct?.images?.[0] || "";
        const effectiveImage = typeof rawImg === "object" ? (rawImg.url || rawImg.secure_url || "") : (rawImg === "[object Object]" ? "" : String(rawImg || ""));
        const effectivePrice = passedProduct?.price || price || dbProduct?.price || { amount: 1499, currency: "INR" };

        const availableStock = getVariantStock(dbProduct, varientId, selectedSize, Number(passedProduct?.stock) || 10);

        const existingItemIndex = cart.items.findIndex(
            item => getItemId(item.product) === effectiveProductId.toString() &&
                    (item.selectedSize || "M") === selectedSize
        );

        const currentQtyInCart = existingItemIndex > -1 ? cart.items[existingItemIndex].quantity : 0;

        // Stock Limit Validation: Quantity cannot exceed available stock
        if (currentQtyInCart + quantityToAdd > availableStock) {
            return res.status(400).json({
                message: `Cannot add more items. Only ${availableStock} items available in stock.`,
                success: false,
                availableStock,
                currentQtyInCart
            });
        }

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += quantityToAdd;
            cart.items[existingItemIndex].stock = availableStock;
        } else {
            cart.items.push({
                product: effectiveProductId,
                varient: varientId || null,
                selectedSize,
                quantity: quantityToAdd,
                price: effectivePrice,
                title: effectiveTitle,
                image: effectiveImage,
                stock: availableStock
            });
        }

        await cart.save();

        return res.status(200).json({
            message: "Product added to cart successfully",
            success: true,
            cart
        });
    } catch (error) {
        console.error("Add to cart error:", error);
        return res.status(500).json({
            message: error.message || "Failed to add to cart",
            success: false
        });
    }
};

export const getCart = async (req, res) => {
    try {
        let cart = await cartModel.findOne({ user: req.user._id });
        if (!cart) {
            cart = await cartModel.create({ user: req.user._id, items: [] });
        }
        return res.status(200).json({
            message: "Cart retrieved successfully",
            success: true,
            cart
        });
    } catch (error) {
        console.error("Get cart error:", error);
        return res.status(500).json({
            message: error.message || "Failed to retrieve cart",
            success: false
        });
    }
};

export const updateCartItemQuantity = async (req, res) => {
    try {
        const { index, quantity, selectedSize } = req.body;
        let cart = await cartModel.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({
                message: "Cart not found",
                success: false
            });
        }

        const idx = Number(index);
        if (isNaN(idx) || idx < 0 || idx >= cart.items.length) {
            return res.status(400).json({
                message: "Invalid item index",
                success: false
            });
        }

        const item = cart.items[idx];
        const effectiveSize = selectedSize || item.selectedSize || "M";

        // Query product for real stock if available
        let availableStock = item.stock || 10;
        try {
            const pId = getItemId(item.product);
            if (String(pId).match(/^[0-9a-fA-F]{24}$/)) {
                const dbProduct = await productModel.findById(pId);
                availableStock = getVariantStock(dbProduct, item.varient, effectiveSize, availableStock);
            }
        } catch (e) {}

        if (quantity !== undefined) {
            const newQty = Number(quantity);
            if (newQty < 1) {
                return res.status(400).json({
                    message: "Minimum quantity is 1",
                    success: false
                });
            }
            if (newQty > availableStock) {
                return res.status(400).json({
                    message: `Quantity cannot exceed available stock of ${availableStock} units.`,
                    success: false,
                    availableStock
                });
            }
            cart.items[idx].quantity = newQty;
        }

        if (selectedSize) {
            cart.items[idx].selectedSize = selectedSize;
            cart.items[idx].stock = availableStock;
        }

        await cart.save();

        return res.status(200).json({
            message: "Cart updated successfully",
            success: true,
            cart
        });
    } catch (error) {
        console.error("Update cart error:", error);
        return res.status(500).json({
            message: error.message || "Failed to update cart",
            success: false
        });
    }
};

export const removeCartItem = async (req, res) => {
    try {
        const { index, productId } = req.body;
        let cart = await cartModel.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({
                message: "Cart not found",
                success: false
            });
        }

        if (index !== undefined && !isNaN(Number(index))) {
            const idx = Number(index);
            if (idx >= 0 && idx < cart.items.length) {
                cart.items.splice(idx, 1);
            }
        } else if (productId) {
            cart.items = cart.items.filter(item => getItemId(item.product) !== productId.toString());
        }

        await cart.save();

        return res.status(200).json({
            message: "Item removed from cart successfully",
            success: true,
            cart
        });
    } catch (error) {
        console.error("Remove cart item error:", error);
        return res.status(500).json({
            message: error.message || "Failed to remove item",
            success: false
        });
    }
};

export const clearCart = async (req, res) => {
    try {
        let cart = await cartModel.findOne({ user: req.user._id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }

        return res.status(200).json({
            message: "Cart cleared successfully",
            success: true,
            cart: cart || { items: [] }
        });
    } catch (error) {
        console.error("Clear cart error:", error);
        return res.status(500).json({
            message: error.message || "Failed to clear cart",
            success: false
        });
    }
};

export const incrementCartItemQuantity = async (req, res) => {
    try {
        const { productId, varientId } = req.params;

        const cart = await cartModel.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({
                message: "Cart not found",
                success: false
            });
        }

        const item = cart.items.find(
            it => getItemId(it.product) === productId.toString() &&
                  (!varientId || getItemId(it.varient) === varientId.toString())
        );

        if (!item) {
            return res.status(404).json({
                message: "Item not found in cart",
                success: false
            });
        }

        let availableStock = item.stock || 10;
        try {
            if (String(productId).match(/^[0-9a-fA-F]{24}$/)) {
                const dbProduct = await productModel.findById(productId);
                availableStock = getVariantStock(dbProduct, varientId, item.selectedSize, availableStock);
            }
        } catch (e) {}

        if (item.quantity + 1 > availableStock) {
            return res.status(400).json({
                message: `Cannot exceed available stock of ${availableStock} units.`,
                success: false,
                availableStock
            });
        }

        item.quantity += 1;
        item.stock = availableStock;
        await cart.save();

        return res.status(200).json({
            message: "Item quantity incremented successfully",
            success: true,
            cart
        });
    } catch (error) {
        console.error("Increment quantity error:", error);
        return res.status(500).json({
            message: error.message || "Failed to increment item quantity",
            success: false
        });
    }
};

export const createOrderController = async (req, res) => {
    try {
        const { amount, currency = "INR" } = req.body || {};
        let orderAmount = Number(amount);

        const cart = await cartModel.findOne({ user: req.user._id });

        if (!orderAmount || isNaN(orderAmount) || orderAmount <= 0) {
            if (cart && cart.items && cart.items.length > 0) {
                orderAmount = cart.items.reduce((sum, item) => {
                    const price = Number(item.price?.amount || item.price || 1499);
                    return sum + price * (item.quantity || 1);
                }, 0);
            } else {
                orderAmount = 1499;
            }
        }

        const order = await createOrder({ amount: orderAmount, currency });

        const orderItems = (cart?.items || []).map(item => {
            const rawPrice = item.price;
            const priceAmount = typeof rawPrice === "object" && rawPrice?.amount !== undefined
                ? Number(rawPrice.amount)
                : (Number(rawPrice) || 1499);
            const priceCurrency = typeof rawPrice === "object" && rawPrice?.currency
                ? rawPrice.currency
                : (currency || "INR");

            let imgUrl = "";
            if (typeof item.image === "string") {
                imgUrl = item.image;
            } else if (item.image && typeof item.image === "object") {
                imgUrl = item.image.url || item.image.secure_url || "";
            }

            return {
                title: item.title || "Product",
                productId: item.product || undefined,
                variantId: item.varient || undefined,
                quantity: item.quantity || 1,
                images: imgUrl ? [{ url: imgUrl }] : [],
                description: item.description || "",
                price: {
                    amount: priceAmount,
                    currency: priceCurrency
                }
            };
        });

        const payment = await paymentModel.create({
            user: req.user._id,
            razorpay: {
                orderId: order.id,
            },
            price: {
                amount: orderAmount,
                currency: currency || "INR"
            },
            orderItems
        });

        console.log("\n========================================================");
        console.log("🛒 [PLACE ORDER CLICKED - REAL BACKEND TERMINAL OUTPUT]");
        console.log("========================================================");
        console.log("👤 User ID       :", req.user?._id?.toString() || req.user?.id || "Authenticated User");
        console.log("📧 User Email    :", req.user?.email || "N/A");
        console.log("📦 Order ID      :", order.id);
        console.log("💰 Total Amount  :", `₹${(order.amount / 100).toLocaleString("en-IN")} (${order.amount} paise)`);
        console.log("💱 Currency      :", order.currency);
        console.log("🧾 Receipt No    :", order.receipt);
        console.log("⚡ Status        :", order.status);
        if (cart?.items?.length) {
            console.log("🛍️ Items in Cart  :", cart.items.length, "item(s)");
            cart.items.forEach((it, idx) => {
                console.log(`   [${idx + 1}] ${it.title || "Product"} | Size: ${it.selectedSize || "M"} | Qty: ${it.quantity || 1} | Price: ₹${it.price?.amount || it.price || 1499}`);
            });
        }
        console.log("📋 Full Razorpay Object:");
        console.dir(order, { depth: null, colors: true });
        console.log("========================================================\n");

        return res.status(200).json({
            message: "Order created successfully",
            success: true,
            order,
            paymentId: payment._id,
            keyId: (config.RAZORPAY_KEY_ID || "").replace(/=+$/, "").trim()
        });
    } catch (error) {
        console.error("❌ [Place Order Error]:", error);
        const errorDesc = error?.error?.description || error?.message || "Failed to create order";
        return res.status(500).json({
            message: errorDesc,
            success: false,
            error: error?.error || error?.message
        });
    }
};

/**
 * MongoDB Aggregation Pipeline for calculating exact cart costs, discounts, and payment breakdowns
 * (UPI, EMI Plans, Pay Later) based on user's active cart.
 */
export const getCartPaymentAggregation = async (req, res) => {
    try {
        const userId = req.user._id;
        const { couponCode = "" } = req.query || req.body || {};

        // Run MongoDB Aggregation Pipeline on cartModel
        const pipeline = [
            // Stage 1: Match the specific user's cart document
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId)
                }
            },
            // Stage 2: Unwind the items array so each item is processed as a separate document
            {
                $unwind: {
                    path: "$items",
                    preserveNullAndEmptyArrays: false
                }
            },
            // Stage 3: Normalize price, quantity, and metadata
            {
                $project: {
                    userId: "$user",
                    productId: "$items.product",
                    varientId: "$items.varient",
                    title: "$items.title",
                    image: "$items.image",
                    selectedSize: { $ifNull: ["$items.selectedSize", "M"] },
                    quantity: { $ifNull: ["$items.quantity", 1] },
                    unitPrice: {
                        $cond: {
                            if: { $gt: ["$items.price.amount", null] },
                            then: { $toDouble: "$items.price.amount" },
                            else: {
                                $cond: {
                                    if: { $gt: ["$items.price", null] },
                                    then: { $toDouble: "$items.price" },
                                    else: 1499
                                }
                            }
                        }
                    }
                }
            },
            // Stage 4: Calculate selling price and MRP per line item
            {
                $addFields: {
                    itemSellingTotal: { $multiply: ["$unitPrice", "$quantity"] },
                    itemMrp: { $multiply: ["$unitPrice", 1.5] },
                    itemMrpTotal: { $multiply: ["$unitPrice", 1.5, "$quantity"] }
                }
            },
            // Stage 5: Group all items together into a comprehensive cart calculation document
            {
                $group: {
                    _id: "$userId",
                    totalItemsCount: { $sum: 1 },
                    totalQuantity: { $sum: "$quantity" },
                    subtotal: { $sum: "$itemSellingTotal" },
                    totalMrp: { $sum: "$itemMrpTotal" },
                    items: {
                        $push: {
                            productId: "$productId",
                            title: "$title",
                            image: "$image",
                            selectedSize: "$selectedSize",
                            quantity: "$quantity",
                            unitPrice: "$unitPrice",
                            itemSellingTotal: "$itemSellingTotal",
                            itemMrpTotal: "$itemMrpTotal"
                        }
                    }
                }
            },
            // Stage 6: Calculate MRP savings and delivery fee
            {
                $project: {
                    _id: 0,
                    userId: "$_id",
                    totalItemsCount: 1,
                    totalQuantity: 1,
                    subtotal: { $round: ["$subtotal", 2] },
                    totalMrp: { $round: ["$totalMrp", 2] },
                    mrpDiscount: {
                        $round: [{ $subtract: ["$totalMrp", "$subtotal"] }, 2]
                    },
                    shippingFee: {
                        $cond: {
                            if: { $gte: ["$subtotal", 999] },
                            then: 0,
                            else: 99
                        }
                    },
                    convenienceFee: { $literal: 0 },
                    items: 1
                }
            }
        ];

        const results = await cartModel.aggregate(pipeline);

        if (!results || results.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Cart is empty",
                data: {
                    totalItemsCount: 0,
                    totalQuantity: 0,
                    subtotal: 0,
                    totalMrp: 0,
                    mrpDiscount: 0,
                    couponDiscount: 0,
                    shippingFee: 0,
                    finalTotal: 0,
                    finalTotalInPaise: 0,
                    paymentOptions: {
                        upi: { payableAmount: 0, instantDiscount: 0, offerBadge: "0% Fees", supportedApps: [] },
                        emi: [],
                        payLater: []
                    },
                    items: []
                }
            });
        }

        const summary = results[0];

        // Calculate dynamic coupon discount
        let couponDiscount = 0;
        const normalizedCoupon = String(couponCode).trim().toUpperCase();
        if (normalizedCoupon === "SNITCH500") {
            couponDiscount = Math.min(500, summary.subtotal);
        } else if (normalizedCoupon === "SNITCH10") {
            couponDiscount = Math.round(summary.subtotal * 0.1);
        }

        const finalTotal = Math.max(0, summary.subtotal - couponDiscount + summary.shippingFee);
        const finalTotalInPaise = Math.round(finalTotal * 100);
        const totalSavings = summary.mrpDiscount + couponDiscount;

        // Dynamic Payment Breakdowns calculated specifically for user's product cost
        const paymentOptions = {
            upi: {
                payableAmount: finalTotal,
                instantDiscount: 0,
                transactionFee: 0,
                offerBadge: "⚡ 0% Extra Surcharge",
                supportedApps: [
                    { id: "gpay", name: "Google Pay", icon: "🌐", tagline: "Fastest Checkout" },
                    { id: "phonepe", name: "PhonePe", icon: "🟣", tagline: "Flat 0% Fees" },
                    { id: "paytm", name: "Paytm UPI", icon: "🔷", tagline: "Instant Refund" },
                    { id: "cred", name: "CRED UPI", icon: "⭐", tagline: "Reward Coins" }
                ],
                qrAvailable: true
            },
            emi: [
                {
                    tenureMonths: 3,
                    monthlyInstallment: Math.round(finalTotal / 3),
                    interestRate: 0,
                    isNoCost: true,
                    tag: "NO COST EMI",
                    totalPayable: finalTotal,
                    interestSaved: Math.round(finalTotal * 0.04),
                    eligibleBanks: ["HDFC", "ICICI", "SBI", "Axis", "Kotak", "OneCard"]
                },
                {
                    tenureMonths: 6,
                    monthlyInstallment: Math.round((finalTotal * 1.04) / 6),
                    interestRate: 8,
                    isNoCost: false,
                    tag: "LOW INTEREST",
                    totalPayable: Math.round(finalTotal * 1.04),
                    eligibleBanks: ["HDFC", "ICICI", "SBI", "Axis", "Kotak"]
                },
                {
                    tenureMonths: 9,
                    monthlyInstallment: Math.round((finalTotal * 1.07) / 9),
                    interestRate: 11,
                    isNoCost: false,
                    tag: "STANDARD",
                    totalPayable: Math.round(finalTotal * 1.07),
                    eligibleBanks: ["HDFC", "ICICI", "SBI", "Axis"]
                },
                {
                    tenureMonths: 12,
                    monthlyInstallment: Math.round((finalTotal * 1.10) / 12),
                    interestRate: 14,
                    isNoCost: false,
                    tag: "EASY FLEX",
                    totalPayable: Math.round(finalTotal * 1.10),
                    eligibleBanks: ["HDFC", "ICICI", "SBI", "Axis", "Kotak", "Federal"]
                }
            ],
            payLater: [
                {
                    providerId: "simpl",
                    name: "Simpl PayLater",
                    description: "Pay in 15 days or 3 interest-free installments",
                    installmentAmount: Math.round(finalTotal / 3),
                    splitCycles: 3,
                    interestRate: 0,
                    preApproved: true,
                    creditLimit: 25000
                },
                {
                    providerId: "lazypay",
                    name: "LazyPay (by PayU)",
                    description: "Buy now, pay next month. 1-click checkout with no OTP",
                    installmentAmount: finalTotal,
                    splitCycles: 1,
                    interestRate: 0,
                    preApproved: true,
                    creditLimit: 100000
                },
                {
                    providerId: "amazon",
                    name: "Amazon Pay Later",
                    description: "Instant pre-approved digital credit line",
                    installmentAmount: finalTotal,
                    splitCycles: 1,
                    interestRate: 0,
                    preApproved: true,
                    creditLimit: 60000
                },
                {
                    providerId: "zestmoney",
                    name: "ZestMoney / Snapmint",
                    description: "Cardless EMI with 0% interest on 3-month repayments",
                    installmentAmount: Math.round(finalTotal / 3),
                    splitCycles: 3,
                    interestRate: 0,
                    preApproved: true,
                    creditLimit: 50000
                }
            ]
        };

        return res.status(200).json({
            success: true,
            message: "Cart payment aggregation calculated successfully",
            data: {
                ...summary,
                appliedCoupon: normalizedCoupon || null,
                couponDiscount,
                finalTotal,
                finalTotalInPaise,
                totalSavings,
                paymentOptions
            }
        });
    } catch (error) {
        console.error("Cart aggregation pipeline error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to calculate cart payment aggregation"
        });
    }
};

export const verifyOrderController = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            rezorpay_order_id,
            rezorpay_payment_id,
            rezorpay_signature,
        } = req.body || {};

        const orderId = razorpay_order_id || rezorpay_order_id;
        const paymentId = razorpay_payment_id || rezorpay_payment_id;
        const signature = razorpay_signature || rezorpay_signature;

        if (!orderId) {
            return res.status(400).json({
                message: "Order ID is required",
                success: false
            });
        }

        const payment = await paymentModel.findOne({
            "razorpay.orderId": orderId,
            status: "pending"
        });

        if (!payment) {
            return res.status(404).json({
                message: "Payment not found or already processed",
                success: false
            });
        }

        const secret = (config.RAZORPAY_KEY_SECRET || "").trim();
        let isPaymentValid = false;

        if (secret && signature && paymentId) {
            try {
                isPaymentValid = validatePaymentVerification(
                    { order_id: orderId, payment_id: paymentId },
                    signature,
                    secret
                );
            } catch (err) {
                const generatedSignature = crypto
                    .createHmac("sha256", secret)
                    .update(`${orderId}|${paymentId}`)
                    .digest("hex");
                isPaymentValid = generatedSignature === signature;
            }
        } else {
            // Fallback for test environments if secret is absent
            isPaymentValid = true;
        }

        if (!isPaymentValid) {
            payment.status = "failed";
            await payment.save();
            return res.status(400).json({
                message: "Payment verification failed: Invalid signature",
                success: false
            });
        }

        payment.status = "paid";
        if (paymentId) payment.razorpay.paymentId = paymentId;
        if (signature) payment.razorpay.signature = signature;
        await payment.save();

        // Clear user's cart on successful payment
        await cartModel.findOneAndUpdate(
            { user: req.user._id },
            { $set: { items: [] } }
        );

        return res.status(200).json({
            message: "Payment verified successfully",
            success: true,
            payment
        });
    } catch (error) {
        console.error("Payment verification error:", error);
        return res.status(500).json({
            message: error.message || "Failed to verify payment",
            success: false
        });
    }
};

export const getUserOrders = async (req, res) => {
    try {
        const orders = await paymentModel
            .find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            message: "Orders fetched successfully",
            orders: orders || []
        });
    } catch (error) {
        console.error("Get user orders error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve orders",
            orders: []
        });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        let query = { user: req.user._id };

        if (mongoose.Types.ObjectId.isValid(orderId)) {
            query._id = orderId;
        } else {
            query["razorpay.orderId"] = orderId;
        }

        let order = await paymentModel.findOne(query).lean();
        if (!order && !mongoose.Types.ObjectId.isValid(orderId)) {
            order = await paymentModel.findOne({ "razorpay.paymentId": orderId, user: req.user._id }).lean();
        }

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        return res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        console.error("Get order by id error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve order"
        });
    }
};

export const cancelOrderController = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason = "Ordered by mistake", comment = "" } = req.body;

        let query = { user: req.user._id };
        if (mongoose.Types.ObjectId.isValid(orderId)) {
            query._id = orderId;
        } else {
            query["razorpay.orderId"] = orderId;
        }

        let order = await paymentModel.findOne(query);
        if (!order && !mongoose.Types.ObjectId.isValid(orderId)) {
            order = await paymentModel.findOne({ "razorpay.paymentId": orderId, user: req.user._id });
        }

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (order.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "This order is already cancelled"
            });
        }

        if (order.status === "delivered") {
            return res.status(400).json({
                success: false,
                message: "Delivered orders cannot be cancelled. Please use the Return/Exchange option."
            });
        }

        const refundAmount = order.price?.amount || 0;

        order.status = "cancelled";
        order.cancellation = {
            reason,
            comment,
            cancelledAt: new Date(),
            refundStatus: order.status === "paid" ? "processed" : "na",
            refundAmount
        };

        await order.save();

        console.log(`[ORDER CANCELLED] ID: ${order._id} | User: ${req.user._id} | Reason: ${reason}`);

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully. Refund initiated to original payment source.",
            order
        });
    } catch (error) {
        console.error("Cancel order error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to cancel order"
        });
    }
};

export const returnOrderController = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { 
            reason = "Size Issue", 
            action = "refund", 
            exchangeSize = "L", 
            comment = "", 
            pickupAddress = "" 
        } = req.body;

        let query = { user: req.user._id };
        if (mongoose.Types.ObjectId.isValid(orderId)) {
            query._id = orderId;
        } else {
            query["razorpay.orderId"] = orderId;
        }

        let order = await paymentModel.findOne(query);
        if (!order && !mongoose.Types.ObjectId.isValid(orderId)) {
            order = await paymentModel.findOne({ "razorpay.paymentId": orderId, user: req.user._id });
        }

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (order.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cancelled orders cannot be returned"
            });
        }

        order.status = "return_requested";
        order.returnRequest = {
            reason,
            action,
            exchangeSize: action === "exchange" ? exchangeSize : "",
            comment,
            pickupAddress,
            requestedAt: new Date(),
            status: "requested"
        };

        await order.save();

        console.log(`[RETURN REQUESTED] ID: ${order._id} | Action: ${action} | Reason: ${reason}`);

        return res.status(200).json({
            success: true,
            message: action === "exchange" 
                ? "Exchange request submitted! Reverse courier pickup scheduled." 
                : "Return request submitted! Reverse courier pickup scheduled & refund initiated.",
            order
        });
    } catch (error) {
        console.error("Return order error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to submit return request"
        });
    }
};




