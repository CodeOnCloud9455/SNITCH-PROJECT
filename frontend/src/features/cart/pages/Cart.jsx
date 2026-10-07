import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { useCart } from "../hook/useCart";
import { useWishlist } from "../../products/hooks/useWishlist";
import { formatPrice, formateCurrency, getImageUrl, getItemImage, getSafeAmount, getSafeId } from "../../products/utils/formatters";
import { CURATED_COLLECTION } from "../../products/utils/curatedCollections";
import { useRazorpay } from "react-razorpay";

export default function Cart() {
  const {
    handleRemoveItem,
    handleUpdateQuantity,
    handleClearCart,
    cartItems,
    handleCreateCartOrder,
    handleVerifyCartPayment,
    handleGetPaymentAggregation,
    handleVerifyCartOrder
  } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("SNITCH500");
  const [couponError, setCouponError] = useState("");
  const [toastMessage, setToastMessage] = useState(null);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [pincode, setPincode] = useState("560001");
  const [isEditingPincode, setIsEditingPincode] = useState(false);
  const [tempPincode, setTempPincode] = useState("560001");
  const { error, isLoading, Razorpay } = useRazorpay();
  const user = useSelector((state) => state.auth?.user);

  // Server-side Aggregation Pipeline State
  const [serverAggregation, setServerAggregation] = useState(null);

  // Payment Options Popup states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTab, setPaymentTab] = useState("upi"); // "upi" | "emi" | "paylater"
  const [selectedUpiApp, setSelectedUpiApp] = useState("gpay");
  const [customUpiId, setCustomUpiId] = useState("");
  const [selectedEmiBank, setSelectedEmiBank] = useState("HDFC");
  const [selectedEmiTenure, setSelectedEmiTenure] = useState(3);
  const [selectedPayLaterProvider, setSelectedPayLaterProvider] = useState("simpl");

  // Fetch real-time MongoDB Aggregation Pipeline for cart & payment breakdown
  React.useEffect(() => {
    let isMounted = true;
    async function syncCartAggregation() {
      if (user && cartItems.length > 0) {
        const res = await handleGetPaymentAggregation({ couponCode: appliedCoupon });
        if (isMounted && res) {
          setServerAggregation(res);
        }
      }
    }
    syncCartAggregation();
    return () => {
      isMounted = false;
    };
  }, [user, cartItems, appliedCoupon]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const calculations = useMemo(() => {
    let totalSellingPrice = 0;
    let totalMrp = 0;

    cartItems.forEach((item) => {
      const price = getSafeAmount(item.price?.amount || item.price || 1499);
      const mrp = Number(item.mrp) || Math.round(price * 1.5) || 2999;
      const qty = item.quantity || 1;

      totalSellingPrice += price * qty;
      totalMrp += mrp * qty;
    });

    const totalCount = cartItems.reduce((sum, it) => sum + (it.quantity || 1), 0);
    const mrpDiscount = Math.max(0, totalMrp - totalSellingPrice);

    let couponDiscount = 0;
    if (appliedCoupon === "SNITCH500") {
      couponDiscount = Math.min(500, totalSellingPrice);
    } else if (appliedCoupon === "SNITCH10") {
      couponDiscount = Math.round(totalSellingPrice * 0.1);
    }

    const finalTotal = Math.max(0, totalSellingPrice - couponDiscount);
    const totalSavings = mrpDiscount + couponDiscount;

    return {
      totalMrp,
      mrpDiscount,
      totalSellingPrice,
      couponDiscount,
      finalTotal,
      totalSavings,
      totalCount,
    };
  }, [cartItems, appliedCoupon]);

  const emiPlans = useMemo(() => {
    const total = calculations.finalTotal;
    return [
      {
        tenure: 3,
        label: "3 Months",
        monthly: Math.round(total / 3),
        interestRate: 0,
        noCost: true,
        tag: "NO COST EMI",
      },
      {
        tenure: 6,
        label: "6 Months",
        monthly: Math.round((total * 1.04) / 6),
        interestRate: 8,
        noCost: false,
        tag: "LOW INTEREST",
      },
      {
        tenure: 9,
        label: "9 Months",
        monthly: Math.round((total * 1.07) / 9),
        interestRate: 11,
        noCost: false,
        tag: "STANDARD",
      },
      {
        tenure: 12,
        label: "12 Months",
        monthly: Math.round((total * 1.1) / 12),
        interestRate: 14,
        noCost: false,
        tag: "EASY FLEX",
      },
    ];
  }, [calculations.finalTotal]);

  const updateQty = (index, delta) => {
    const targetItem = cartItems[index];
    if (!targetItem) return;
    const currentQty = targetItem.quantity || 1;
    const maxStock = Number(targetItem.stock || 10);

    // Minimum quantity is 1. Can only be removed via the Remove button.
    if (delta < 0 && currentQty <= 1) {
      showToast("Minimum quantity is 1. Click Remove to delete.");
      return;
    }

    // Maximum quantity cannot exceed available variant stock
    if (delta > 0 && currentQty >= maxStock) {
      showToast(`Cannot add more. Only ${maxStock} items available in stock.`);
      return;
    }

    const newQty = currentQty + delta;
    handleUpdateQuantity(index, newQty);
  };

  const handleRemove = (index, title) => {
    handleRemoveItem(index);
    showToast(`Removed "${title || "Item"}" from bag`);
  };

  const handleMoveToWishlist = (item, index) => {
    const pId = getSafeId(item._id || item.id);
    toggleWishlist({
      ...item,
      _id: pId,
      id: pId,
    });
    handleRemoveItem(index);
    showToast(`Moved "${item.title || "Item"}" to Wishlist ❤️`);
  };

  const handleApplyCoupon = (e) => {
    e?.preventDefault();
    setCouponError("");
    const code = couponCode.trim().toUpperCase();
    if (code === "SNITCH500" || code === "SNITCH10") {
      setAppliedCoupon(code);
      setCouponCode("");
      showToast(`Coupon ${code} applied successfully!`);
    } else if (code === "") {
      setCouponError("Please enter a coupon code");
    } else {
      setCouponError("Invalid promo code. Try SNITCH500 or SNITCH10");
    }
  };

  const navigate = useNavigate();

  async function handleCheckout() {
    if (!user) {
      showToast("Please log in to proceed with checkout");
      setTimeout(() => {
        navigate("/login", { state: { from: "/cart" } });
      }, 800);
      return;
    }

    try {
      const orderData = await handleCreateCartOrder({ amount: calculations.finalTotal });
      console.log("Order created:", orderData);

      const order = orderData?.order || orderData;
      const keyId = orderData?.keyId || "rzp_test_TeCmRedZmn4kZF";

      if (!order || !order.id) {
        showToast("Unable to initiate order. Please try again.");
        return;
      }

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "SNITCH",
        description: "Order Checkout",
        order_id: order.id,
        handler: async (response) => {
          const isValid = await handleVerifyCartOrder(response);
          if (isValid) {
            const purchasedItems = [...cartItems];
            const paidCalculations = { ...calculations };
            handleClearCart();
            navigate(`/order-success?order_id=${response.razorpay_order_id}&payment_id=${response.razorpay_payment_id || ''}`, {
              state: {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                items: purchasedItems,
                calculations: paidCalculations,
                user: user
              }
            });
          } else {
            showToast("Payment verification failed. Please try again.");
          }
        },
        prefill: {
          name: user?.fullname || user?.name || "",
          email: user?.email || "",
          contact: user?.contact || user?.phone || "",
        },
        theme: {
          color: "#000000",
        },
      };

      if (!window.Razorpay) {
        console.error("Razorpay SDK not loaded");
        showToast("Razorpay is not loaded. Please refresh the page.");
        return;
      }

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on("payment.failed", (response) => {
        console.error("Payment failed:", response.error);
        showToast(
          response.error?.description || "Payment failed. Please try again."
        );
      });

      razorpayInstance.open();
    } catch (err) {
      console.error("Checkout error:", err);
      if (err?.response?.status === 401) {
        showToast("Session expired. Please log in again.");
        navigate("/login", {
          state: { from: "/cart" },
        });
      } else {
        showToast("Failed to initiate order. Please try again.");
      }
    }
  }

    

  const handlePincodeSubmit = (e) => {
    e.preventDefault();
    if (tempPincode.trim().length === 6) {
      setPincode(tempPincode.trim());
      setIsEditingPincode(false);
      showToast(`Delivery location updated to ${tempPincode.trim()}`);
    } else {
      showToast("Please enter a valid 6-digit Pincode");
    }
  };

  
  

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col selection:bg-white selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white text-black px-4 py-2.5 rounded-lg shadow-2xl font-bold text-xs flex items-center gap-2 border border-neutral-300 animate-bounce">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight font-brand uppercase">
              Shopping Bag
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-neutral-900 text-neutral-300 border border-neutral-800 font-space">
              {calculations.totalCount} {calculations.totalCount === 1 ? "item" : "items"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-space font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>← Continue Shopping</span>
            </Link>

            <Link
              to="/wishlist"
              className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-rose-400 hover:text-rose-300 text-xs font-space font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>❤️ View Wishlist</span>
            </Link>

            {cartItems.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to clear your entire bag?")) {
                    handleClearCart();
                    showToast("Cart cleared");
                  }
                }}
                className="text-xs text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer font-space"
              >
                Clear Bag
              </button>
            )}
          </div>
        </div>

        {orderConfirmed ? (
          /* Order Confirmed Screen */
          <div className="py-20 text-center flex flex-col items-center justify-center bg-neutral-950 border border-neutral-800 rounded-2xl p-8 max-w-lg mx-auto shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-black flex items-center justify-center text-2xl font-black mb-4 shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse">
              ✓
            </div>
            <h2 className="text-2xl font-black mb-2 uppercase font-brand tracking-wider">Order Confirmed!</h2>
            <p className="text-xs text-neutral-400 mb-6 max-w-sm font-body">
              Thank you for shopping with SNITCH. Your order will be dispatched via 24H Express Delivery to Pincode {pincode}.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <Link
                to="/"
                onClick={() => setOrderConfirmed(false)}
                className="px-6 py-3 bg-white text-black font-black text-xs uppercase tracking-wider rounded-lg hover:bg-neutral-200 transition-all font-space"
              >
                Continue Shopping →
              </Link>
              <Link
                to="/wishlist"
                onClick={() => setOrderConfirmed(false)}
                className="px-6 py-3 bg-neutral-900 text-white border border-neutral-800 font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-neutral-800 transition-all font-space"
              >
                View Wishlist ❤️
              </Link>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          /* Empty Bag State (Myntra/Flipkart Style) */
          <div className="py-16 sm:py-24 text-center flex flex-col items-center justify-center bg-neutral-950/80 border border-neutral-800 rounded-2xl p-8 max-w-xl mx-auto shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-4xl text-neutral-400 mb-4 animate-float">
              🛍️
            </div>
            <h2 className="text-xl font-black mb-2 uppercase font-brand tracking-wide">
              Hey, your bag feels so light!
            </h2>
            <p className="text-xs text-neutral-400 mb-6 max-w-sm leading-relaxed font-body">
              There is nothing in your bag. Explore our newest drops, oversized tees, linen shirts, and trending styles.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                to="/"
                className="px-6 py-3 bg-white text-black font-black text-xs uppercase tracking-wider rounded-lg hover:bg-neutral-200 transition-all font-space shadow-xl hover:scale-105"
              >
                Explore Collection →
              </Link>
              <Link
                to="/wishlist"
                className="px-6 py-3 bg-neutral-900 text-white border border-neutral-700 hover:border-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-neutral-800 transition-all font-space hover:scale-105 flex items-center gap-2"
              >
                <span>Add from Wishlist ❤️</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Main 2-Column Bag Layout (Flipkart / Myntra Layout) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (Items & Delivery): 7 or 8 Cols */}
            <div className="lg:col-span-7 space-y-4">
              {/* Delivery Address / Pincode Strip */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/90 flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">📍</span>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Deliver to: <strong className="font-space tracking-wider">{pincode}</strong></span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded font-space font-bold uppercase">
                        Express 24H
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-space mt-0.5">
                      Delivery by <strong className="text-neutral-200">Tomorrow, 4 PM</strong> | Free Delivery
                    </p>
                  </div>
                </div>

                {isEditingPincode ? (
                  <form onSubmit={handlePincodeSubmit} className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={tempPincode}
                      onChange={(e) => setTempPincode(e.target.value.replace(/\D/g, ""))}
                      placeholder="Pincode"
                      className="w-24 px-2.5 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs text-white font-space outline-none focus:border-white"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-white text-black text-xs font-bold rounded hover:bg-neutral-200 cursor-pointer font-space"
                    >
                      Check
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingPincode(false)}
                      className="text-xs text-neutral-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setTempPincode(pincode);
                      setIsEditingPincode(true);
                    }}
                    className="px-3 py-1 text-xs font-bold text-neutral-300 hover:text-white border border-neutral-700 hover:border-white rounded-md bg-neutral-900 transition-colors cursor-pointer font-space uppercase tracking-wider"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Available Bank Offers Strip */}
              <div className="p-3.5 rounded-xl bg-neutral-950/90 border border-neutral-800/80 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400">🏷️</span>
                  <span className="text-neutral-300 text-[11px]">
                    Get flat ₹500 OFF with code <strong className="text-white font-space">SNITCH500</strong>
                  </span>
                </div>
                {appliedCoupon !== "SNITCH500" && (
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon("SNITCH500");
                      showToast("Coupon SNITCH500 applied!");
                    }}
                    className="text-[11px] font-bold text-white hover:underline cursor-pointer font-space whitespace-nowrap"
                  >
                    Apply Now
                  </button>
                )}
              </div>
              {/* Items Card List */}
              <div className="space-y-3.5">
                {cartItems.map((item, idx) => {
                  const imgUrl = getItemImage(item, CURATED_COLLECTION);
                  const price = getSafeAmount(item.price?.amount || item.price || 1499);
                  const mrp = Number(item.mrp) || Math.round(price * 1.5) || 2999;
                  const discountPct = Math.max(10, Math.round(((mrp - price) / mrp) * 100));
                  const itemTotal = price * (item.quantity || 1);
                  const maxStock = Number(item.stock || item.selectedVariant?.stock || 10);
                  const isMinQty = (item.quantity || 1) <= 1;
                  const isMaxQty = (item.quantity || 1) >= maxStock;
                  const itemWishlisted = isWishlisted(item);

                  return (
                    <div
                      key={item._id || item.id || idx}
                      className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/90 hover:border-neutral-700 transition-all duration-300 flex flex-col gap-3.5 group shadow-lg"
                    >
                      {/* Top Part: Image, Info & Price */}
                      <div className="flex gap-4">
                        {/* Vertical Aspect Cover Image */}
                        <div className="w-22 sm:w-26 aspect-[3/4] bg-neutral-900 rounded-xl overflow-hidden flex-shrink-0 border border-neutral-800 relative">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={item.title || "Product"}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80";
                              }}
                              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-neutral-600">
                              SNITCH
                            </div>
                          )}
                          <span className="absolute top-1 left-1 bg-black/80 backdrop-blur-xs text-[8px] font-black uppercase tracking-wider text-neutral-300 px-1.5 py-0.5 rounded">
                            {item.selectedSize || "M"}
                          </span>
                        </div>

                        {/* Title, Details, Size selector & Price */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest font-space block">
                                  SNITCH
                                </span>
                                <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-neutral-200 transition-colors font-display">
                                  {item.title}
                                </h3>
                              </div>
                            </div>

                            {/* Size selector pills */}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[11px] text-neutral-400 font-space font-medium">Size:</span>
                              <div className="flex items-center gap-1">
                                {["S", "M", "L", "XL"].map((sz) => {
                                  const isSelected = (item.selectedSize || "M") === sz;
                                  return (
                                    <button
                                      key={sz}
                                      type="button"
                                      onClick={() => {
                                        handleUpdateQuantity(idx, item.quantity || 1, {
                                          ...item,
                                          selectedSize: sz,
                                        });
                                        showToast(`Size updated to ${sz}`);
                                      }}
                                      className={`w-6 h-6 rounded-md text-[10px] font-black transition-all cursor-pointer font-space flex items-center justify-center ${
                                        isSelected
                                          ? "bg-white text-black shadow-md scale-105"
                                          : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
                                      }`}
                                    >
                                      {sz}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Return Policy & Stock Status tag */}
                            <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-400 font-space">
                              <span className="text-emerald-400 flex items-center gap-1">
                                <span>✓</span> 7-Day Free Replacement
                              </span>
                              {isMaxQty && (
                                <span className="text-amber-400 font-bold bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.2 rounded text-[9px]">
                                  Max stock ({maxStock}) reached
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Price breakdown */}
                          <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
                            <span className="text-base font-black text-white font-space">
                              {formatPrice(itemTotal)}
                            </span>
                            <span className="text-xs text-neutral-500 line-through font-space">
                              {formatPrice(mrp * (item.quantity || 1))}
                            </span>
                            <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-900/60 px-1.5 py-0.2 rounded font-space uppercase">
                              {discountPct}% OFF
                            </span>

                          </div>
                        </div>
                      </div>

                      {/* Bottom Action Strip (Flipkart & Myntra Style) */}
                      <div className="pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3">
                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-neutral-400 font-space">Qty:</span>
                          <div className="flex items-center bg-neutral-900 border border-neutral-700 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => updateQty(idx, -1)}
                              disabled={isMinQty}
                              className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded transition-colors ${
                                isMinQty
                                  ? "text-neutral-600 cursor-not-allowed opacity-40"
                                  : "text-neutral-300 hover:text-white hover:bg-neutral-800 cursor-pointer"
                              }`}
                              title={isMinQty ? "Minimum quantity is 1. Click Remove to delete." : "Decrease quantity"}
                            >
                              −
                            </button>
                            <span className="w-7 text-center text-xs font-black text-white font-space">
                              {item.quantity || 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQty(idx, 1)}
                              disabled={isMaxQty}
                              className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded transition-colors ${
                                isMaxQty
                                  ? "text-neutral-600 cursor-not-allowed opacity-40"
                                  : "text-neutral-300 hover:text-white hover:bg-neutral-800 cursor-pointer"
                              }`}
                              title={isMaxQty ? `Maximum stock limit reached (${maxStock} available)` : "Increase quantity"}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Action Buttons: Move to Wishlist & Remove */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleMoveToWishlist(item, idx)}
                            className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-rose-400 text-xs font-space font-bold transition-all cursor-pointer flex items-center gap-1.5"
                            title="Move to Wishlist"
                          >
                            <span className={itemWishlisted ? "text-rose-500" : "text-neutral-400"}>❤️</span>
                            <span>Move to Wishlist</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemove(idx, item.title)}
                            className="px-3 py-1.5 rounded-lg bg-rose-950/20 hover:bg-rose-600 border border-rose-900/30 hover:border-rose-600 text-rose-400 hover:text-white text-xs font-space font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                            title="Remove from bag"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column (Myntra / Flipkart Price Details Summary): 5 Cols */}
            <div className="lg:col-span-5 space-y-4 sticky top-20">
              {/* Promo Coupon Card */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3 shadow-lg">
                <span className="text-xs font-black uppercase tracking-wider text-neutral-300 block font-space">
                  Apply Coupons
                </span>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError("");
                    }}
                    className="flex-1 bg-neutral-900 border border-neutral-700 text-white px-3 py-2 text-xs rounded-lg uppercase outline-none focus:border-white font-space"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-white text-black font-black text-xs uppercase tracking-wider rounded-lg hover:bg-neutral-200 transition-all cursor-pointer font-space"
                  >
                    Apply
                  </button>
                </form>

                {couponError && (
                  <p className="text-[11px] text-rose-400 font-semibold">{couponError}</p>
                )}

                {appliedCoupon && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold font-space">
                      <span>✓</span>
                      <span>{appliedCoupon} Applied</span>
                      <span className="text-[10px] text-emerald-300">({formatPrice(calculations.couponDiscount)} OFF)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCode("");
                        showToast("Coupon removed");
                      }}
                      className="text-neutral-400 hover:text-white underline text-[11px] cursor-pointer font-space"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Price Details Breakdown Box (Flipkart / Myntra Style) */}
              <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4 shadow-xl">
                <h2 className="text-xs font-black uppercase tracking-wider text-neutral-400 border-b border-neutral-800 pb-3 font-space">
                  Price Details ({calculations.totalCount} {calculations.totalCount === 1 ? "Item" : "Items"})
                </h2>

                <div className="space-y-3 text-xs text-neutral-300 font-space">
                  <div className="flex justify-between">
                    <span>Total MRP</span>
                    <span className="font-semibold text-white">
                      {formatPrice(calculations.totalMrp)}
                    </span>
                  </div>

                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Discount on MRP</span>
                    <span>− {formatPrice(calculations.mrpDiscount)}</span>
                  </div>

                  {calculations.couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>Coupon Discount</span>
                      <span>− {formatPrice(calculations.couponDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Convenience Fee</span>
                    <span className="text-emerald-400 font-bold">FREE</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Shipping Fee</span>
                    <span className="text-emerald-400 font-bold">FREE</span>
                  </div>
                </div>

                {/* Total Payable */}
                <div className="pt-3.5 border-t border-neutral-800 flex justify-between items-baseline font-space">
                  <div>
                    <span className="text-xs uppercase font-black text-white block">Total Amount</span>
                    <span className="text-[10px] text-neutral-500">Includes all applicable taxes</span>
                  </div>
                  <span className="text-2xl font-black text-white">
                    {formatPrice(calculations.finalTotal)}
                  </span>
                </div>

                {/* Savings Pill */}
                {calculations.totalSavings > 0 && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-800/80 text-center">
                    <p className="text-xs font-black text-emerald-300 font-space">
                      🎉 You will save {formatPrice(calculations.totalSavings)} on this order!
                    </p>
                  </div>
                )}

                {/* UPI / EMI / Pay Later Quick Banner */}
                <div
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="p-3.5 bg-neutral-900/90 border border-neutral-800 hover:border-neutral-600 rounded-xl cursor-pointer transition-all hover:bg-neutral-800/50 group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">⚡</span>
                      <span className="text-xs font-bold text-white uppercase tracking-wider font-space">
                        Payment Options
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80 group-hover:bg-emerald-900 transition-colors">
                      UPI • EMI • PayLater →
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 font-space leading-relaxed">
                    Pay with <span className="text-white font-medium">UPI</span>, <span className="text-emerald-400 font-medium">3-Mo No Cost EMI</span> from ₹{Math.round(calculations.finalTotal / 3)}/mo, or <span className="text-white font-medium">Simpl / LazyPay</span>.
                  </p>
                </div>

                {/* Checkout & Continue Shopping Action Buttons */}
                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="w-full py-4 bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center shadow-2xl font-space hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    <span>Place Order / Pay Options</span>
                    <span>→</span>
                  </button>

                  <Link
                    to="/"
                    className="block w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-600 bg-neutral-900 transition-all text-center font-space"
                  >
                    ← Continue Shopping
                  </Link>
                </div>

                <div className="pt-2 text-center border-t border-neutral-800/60">
                  <p className="text-[11px] text-neutral-400 font-space flex items-center justify-center gap-1.5">
                    <span>🔒</span>
                    <span>100% Safe &amp; Secure Payments</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─── UPI, EMI & PayLater Popup Modal ─── */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setIsPaymentModalOpen(false)}
          />

          <div className="relative w-full max-w-xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 text-white font-sans">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 font-space block">
                  Select Payment Method
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-lg font-black text-white font-brand">
                    PAYABLE: {formatPrice(calculations.finalTotal)}
                  </h3>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                    100% SECURE
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="grid grid-cols-3 border-b border-neutral-800 bg-black text-xs font-space">
              <button
                type="button"
                onClick={() => setPaymentTab("upi")}
                className={`py-3.5 px-3 font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                  paymentTab === "upi"
                    ? "border-white text-white bg-neutral-900/50"
                    : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/20"
                }`}
              >
                <span>⚡</span>
                <span>UPI</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentTab("emi")}
                className={`py-3.5 px-3 font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                  paymentTab === "emi"
                    ? "border-white text-white bg-neutral-900/50"
                    : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/20"
                }`}
              >
                <span>💳</span>
                <span>EMI Plans</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentTab("paylater")}
                className={`py-3.5 px-3 font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                  paymentTab === "paylater"
                    ? "border-white text-white bg-neutral-900/50"
                    : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/20"
                }`}
              >
                <span>⏳</span>
                <span>Pay Later</span>
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 font-space">
              {/* TAB 1: UPI OPTION */}
              {paymentTab === "upi" && (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2">
                      Popular UPI Apps (Instant 0% Fee)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: "gpay", name: "Google Pay", icon: "🌐", tag: "Fast" },
                        { id: "phonepe", name: "PhonePe", icon: "🟣", tag: "Popular" },
                        { id: "paytm", name: "Paytm UPI", icon: "🔷", tag: "Instant" },
                        { id: "cred", name: "CRED UPI", icon: "⭐", tag: "Cashback" },
                      ].map((app) => (
                        <div
                          key={app.id}
                          onClick={() => setSelectedUpiApp(app.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center gap-1 text-center ${
                            selectedUpiApp === app.id
                              ? "border-white bg-neutral-900 ring-1 ring-white"
                              : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
                          }`}
                        >
                          <span className="text-xl">{app.icon}</span>
                          <span className="text-xs font-bold text-white">{app.name}</span>
                          <span className="text-[9px] text-emerald-400 font-mono uppercase">{app.tag}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* UPI ID Input */}
                  <div className="pt-2">
                    <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1.5">
                      Or Enter UPI ID / VPA
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. mobileNumber@upi or username@okhdfcbank"
                        value={customUpiId}
                        onChange={(e) => setCustomUpiId(e.target.value)}
                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customUpiId.includes("@")) {
                            showToast("UPI ID Verified! Proceeding to Pay...");
                            handleCheckout();
                            setIsPaymentModalOpen(false);
                          } else {
                            showToast("Please enter a valid UPI ID (e.g. name@upi)");
                          }
                        }}
                        className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl transition-all font-space"
                      >
                        Verify
                      </button>
                    </div>
                  </div>

                  {/* QR Code Banner */}
                  <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white p-1 rounded-lg flex items-center justify-center text-black font-black text-xs">
                        QR
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Scan &amp; Pay via QR</p>
                        <p className="text-[10px] text-neutral-400">Available on the Razorpay gateway</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-bold">✓ 0% Extra Charges</span>
                  </div>
                </div>
              )}

              {/* TAB 2: EMI OPTION */}
              {paymentTab === "emi" && (
                <div className="space-y-4">
                  {/* Select Bank */}
                  <div>
                    <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2">
                      1. Select Bank for EMI
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {["HDFC", "ICICI", "SBI", "Axis", "Kotak", "OneCard"].map((bank) => (
                        <button
                          key={bank}
                          type="button"
                          onClick={() => setSelectedEmiBank(bank)}
                          className={`py-2 px-1 rounded-lg border text-center text-xs font-bold transition-all ${
                            selectedEmiBank === bank
                              ? "border-white bg-neutral-800 text-white"
                              : "border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700"
                          }`}
                        >
                          {bank}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select Tenure */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                        2. Choose EMI Tenure
                      </label>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        {selectedEmiBank} Bank Selected
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {emiPlans.map((plan) => (
                        <div
                          key={plan.tenure}
                          onClick={() => setSelectedEmiTenure(plan.tenure)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                            selectedEmiTenure === plan.tenure
                              ? "border-white bg-neutral-900 ring-1 ring-white"
                              : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-white">{plan.label}</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                plan.noCost
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                  : "bg-neutral-800 text-neutral-400"
                              }`}
                            >
                              {plan.tag}
                            </span>
                          </div>
                          <div className="mt-2">
                            <span className="text-base font-black text-white">
                              {formatPrice(plan.monthly)}
                            </span>
                            <span className="text-xs text-neutral-400"> / month</span>
                          </div>
                          <p className="text-[10px] text-neutral-500 mt-1 font-mono">
                            {plan.noCost
                              ? "No extra interest charged"
                              : `Interest rate: ${plan.interestRate}% p.a.`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* EMI Note */}
                  <div className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-800 text-[11px] text-neutral-400 leading-relaxed">
                    💡 <span className="text-white font-medium">No-Cost EMI:</span> You will get an instant discount equal to the total interest charged by the bank, making the effective interest rate 0%.
                  </div>
                </div>
              )}

              {/* TAB 3: PAY LATER OPTION */}
              {paymentTab === "paylater" && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
                    Choose Pay Later Partner (0% Interest for 15-30 Days)
                  </span>

                  {[
                    {
                      id: "simpl",
                      name: "Simpl PayLater",
                      desc: "Pay in 15 days or 3 easy installments. 1-click checkout.",
                      badge: "Pre-Approved",
                      limit: "Up to ₹25,000",
                    },
                    {
                      id: "lazypay",
                      name: "LazyPay (by PayU)",
                      desc: "Buy now, pay next month. No OTP needed for approved users.",
                      badge: "Instant Approval",
                      limit: "Up to ₹1,00,000",
                    },
                    {
                      id: "amazon",
                      name: "Amazon Pay Later",
                      desc: "Instant digital credit limit. Repay next month or in EMIs.",
                      badge: "Verified Partner",
                      limit: "Up to ₹60,000",
                    },
                    {
                      id: "zest",
                      name: "ZestMoney / Snapmint",
                      desc: "Cardless credit with 0% interest on 3-month repayments.",
                      badge: "0% Interest",
                      limit: "Up to ₹50,000",
                    },
                  ].map((provider) => (
                    <div
                      key={provider.id}
                      onClick={() => setSelectedPayLaterProvider(provider.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        selectedPayLaterProvider === provider.id
                          ? "border-white bg-neutral-900 ring-1 ring-white"
                          : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{provider.name}</span>
                          <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded font-mono">
                            {provider.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400">{provider.desc}</p>
                      </div>

                      <div className="text-right pl-3 shrink-0">
                        <span className="text-[10px] text-neutral-500 block font-mono">Credit Limit</span>
                        <span className="text-xs font-bold text-white font-mono">{provider.limit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer / Place Order Trigger */}
            <div className="p-4 sm:p-5 border-t border-neutral-800 bg-neutral-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 font-space">
              <div className="text-left w-full sm:w-auto">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                  Method: {paymentTab === "upi" ? "UPI App / VPA" : paymentTab === "emi" ? `${selectedEmiBank} ${selectedEmiTenure}-Mo EMI` : "Pay Later (Simpl/LazyPay)"}
                </span>
                <span className="text-base font-black text-white">
                  Total: {formatPrice(calculations.finalTotal)}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="w-1/3 sm:w-auto px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer font-space"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    handleCheckout();
                  }}
                  className="w-2/3 sm:w-auto px-6 py-3 bg-white hover:bg-neutral-200 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-xl hover:scale-[1.02] font-space"
                >
                  Proceed to Pay →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



