import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams, Link } from "react-router";
import { useSelector } from "react-redux";

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth.user);

  const queryOrderId = searchParams.get("order_id");
  const queryPaymentId = searchParams.get("payment_id");

  const stateData = location.state || {};
  const orderId = stateData.orderId || queryOrderId || `order_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const paymentId = stateData.paymentId || queryPaymentId || `pay_${Math.random().toString(36).substring(2, 10)}`;

  const [copied, setCopied] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const user = stateData.user || authUser || {
    fullname: "Aryan Mehta",
    email: "customer@snitch.co.in",
    contact: "+91 98201 44819",
  };

  // Format order date
  const now = new Date();
  const orderDateStr = now.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const orderTimeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Calculate estimated delivery dates
  const deliveryStart = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const deliveryEnd = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
  const deliveryRangeStr = `${deliveryStart.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - ${deliveryEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;

  // Sample items fallback if accessed directly
  const items = stateData.items && stateData.items.length > 0
    ? stateData.items
    : [
        {
          _id: "demo-1",
          title: "AETERNUM OVERSIZED GRAPHIC TEE",
          selectedSize: "L",
          quantity: 1,
          price: { amount: 1299 },
          image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80",
          color: "Washed Onyx",
          description: "280 GSM Heavy French Terry Cotton"
        },
        {
          _id: "demo-2",
          title: "TACTICAL HEAVY UTILITY CARGO",
          selectedSize: "32",
          quantity: 1,
          price: { amount: 1400 },
          image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&auto=format&fit=crop&q=80",
          color: "Pitch Black",
          description: "Water-repellent Ripstop • Cobra Buckle"
        },
        {
          _id: "demo-3",
          title: "CROPPED TECH BOMBER JACKET",
          selectedSize: "L",
          quantity: 1,
          price: { amount: 800 },
          image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&auto=format&fit=crop&q=80",
          color: "Matte Obsidian",
          description: "Archival Drop Edition"
        },
      ];

  const totalPaid = stateData.calculations?.finalTotal ||
    items.reduce((sum, it) => sum + (Number(it.price?.amount || it.price || 1499) * (it.quantity || 1)), 0);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    showToast("Order Reference copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleSharePurchase = () => {
    if (navigator.share) {
      navigator.share({
        title: "SNITCH Order Confirmation",
        text: `Just ordered my luxury capsule from SNITCH! Order: ${orderId}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("Order link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] pt-24 pb-20 px-4 sm:px-6 lg:px-12 selection:bg-[#10B981] selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#171717] border border-[#10B981] text-[#f5f5f5] px-5 py-3 rounded shadow-2xl flex items-center gap-3 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
          <span className="text-xs font-semibold uppercase tracking-wider">{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-6xl mx-auto space-y-12">
        {/* CELEBRATORY HERO SECTION */}
        <section className="flex flex-col items-center text-center relative pt-4">
          {/* Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-[#10B981]/15 blur-[120px] pointer-events-none rounded-full" />

          {/* Animated Dual-Ring Checkmark Icon */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border border-[#D4AF37]/30 flex items-center justify-center p-2 bg-[#0e0e0e] shadow-2xl">
              <div className="w-full h-full rounded-full border border-[#10B981] flex items-center justify-center bg-[#131313] shadow-[0_0_35px_rgba(16,185,129,0.35)] animate-pulse">
                <svg className="w-10 h-10 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161616] border border-[#262626] rounded mb-4">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            <span className="text-[11px] font-bold tracking-widest text-[#10B981] uppercase">
              STATUS: PAYMENT VERIFIED & SECURED
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="font-brand text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white mb-3">
            ORDER CONFIRMED
          </h1>
          <p className="text-[#a1a1aa] max-w-xl text-base sm:text-lg font-light leading-relaxed">
            Thank you for shopping with <span className="text-white font-semibold">SNITCH</span>. Your high-craft capsule pieces are currently being inspected and prepared for express courier transit.
          </p>
        </section>

        {/* 4 TILES KEY ORDER METADATA ROW */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tile 1: Order Reference */}
          <div className="bg-[#121212] border border-[#262626] p-5 flex flex-col justify-between hover:border-[#404040] transition-colors rounded-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-[#737373] uppercase tracking-widest">ORDER REFERENCE</span>
              <span className="text-xs text-[#525252]">#ID</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm sm:text-base font-bold text-white truncate">{orderId}</span>
              <button
                onClick={handleCopyOrderId}
                className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 border border-[#333] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all bg-[#0a0a0a] rounded-sm shrink-0"
              >
                {copied ? "COPIED" : "COPY"}
              </button>
            </div>
          </div>

          {/* Tile 2: Order Timestamp */}
          <div className="bg-[#121212] border border-[#262626] p-5 flex flex-col justify-between hover:border-[#404040] transition-colors rounded-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-[#737373] uppercase tracking-widest">ORDER TIMESTAMP</span>
              <svg className="w-4 h-4 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-bold text-white block">{orderDateStr}</span>
              <span className="text-xs text-[#a1a1aa]">{orderTimeStr} IST • EXPRESS DISPATCH</span>
            </div>
          </div>

          {/* Tile 3: Payment Verification */}
          <div className="bg-[#121212] border border-[#262626] p-5 flex flex-col justify-between hover:border-[#404040] transition-colors rounded-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-[#737373] uppercase tracking-widest">PAYMENT METHOD</span>
              <svg className="w-4 h-4 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="text-sm font-bold text-white">Razorpay UPI Verified</span>
              </div>
              <span className="text-[10px] text-[#737373] font-mono tracking-wider block mt-0.5 truncate">
                TXN: {paymentId}
              </span>
            </div>
          </div>

          {/* Tile 4: Total Paid */}
          <div className="bg-[#121212] border border-[#262626] border-l-2 border-l-[#10B981] p-5 flex flex-col justify-between hover:border-[#404040] transition-colors rounded-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-[#737373] uppercase tracking-widest">TOTAL PAID</span>
              <span className="text-[10px] font-bold text-[#10B981] tracking-wider uppercase">PAID IN FULL</span>
            </div>
            <div>
              <span className="text-2xl font-black text-white tracking-tight">₹{totalPaid.toLocaleString("en-IN")}</span>
              <span className="text-[10px] text-[#737373] block mt-0.5">Incl. all taxes & luxury packaging</span>
            </div>
          </div>
        </section>

        {/* 4-STEP DELIVERY TRACKING TIMELINE */}
        <section className="bg-[#121212] border border-[#262626] p-6 sm:p-8 rounded-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 mb-6 border-b border-[#262626] gap-2">
            <div>
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest block mb-0.5">
                REAL-TIME DISPATCH PIPELINE
              </span>
              <h2 className="font-brand text-xl sm:text-2xl font-bold tracking-tight text-white uppercase">
                DELIVERY TRACKING
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[#a1a1aa]">WAYBILL: BLUEDART-AIR-{Math.floor(100000 + Math.random() * 900000)}</span>
              <span className="px-2 py-0.5 bg-[#171717] text-[#10B981] text-[10px] font-bold tracking-widest border border-[#10B981]/30">
                PRIORITY FLIGHT
              </span>
            </div>
          </div>

          {/* Timeline Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1: Placed */}
            <div className="flex md:flex-col items-start gap-4">
              <div className="w-10 h-10 bg-[#161616] border border-[#10B981] flex items-center justify-center text-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest block">STEP 01 • DONE</span>
                <h3 className="text-sm font-bold text-white">Order Placed</h3>
                <p className="text-xs text-[#a1a1aa]">{orderDateStr} • {orderTimeStr}</p>
                <span className="text-[10px] text-[#737373]">Authorized & Payment Verified</span>
              </div>
            </div>

            {/* Step 2: Processing & QC */}
            <div className="flex md:flex-col items-start gap-4">
              <div className="w-10 h-10 bg-[#161616] border-2 border-[#D4AF37] flex items-center justify-center text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)] shrink-0 relative animate-pulse">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#D4AF37] rounded-full" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest block">STEP 02 • ACTIVE</span>
                <h3 className="text-sm font-bold text-white">Quality Check & Seal</h3>
                <p className="text-xs text-[#a1a1aa]">Estimated: Tomorrow</p>
                <span className="text-[10px] text-[#737373]">Master Inspection & Monogram Dustbag</span>
              </div>
            </div>

            {/* Step 3: Courier Dispatch */}
            <div className="flex md:flex-col items-start gap-4 opacity-60">
              <div className="w-10 h-10 bg-[#161616] border border-[#333] flex items-center justify-center text-[#737373] shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#737373] uppercase tracking-widest block">STEP 03 • UPCOMING</span>
                <h3 className="text-sm font-semibold text-white">Express Air Dispatch</h3>
                <p className="text-xs text-[#a1a1aa]">BlueDart Air Cargo</p>
                <span className="text-[10px] text-[#737373]">Hub Transit: Mumbai Hub</span>
              </div>
            </div>

            {/* Step 4: Doorstep Delivery */}
            <div className="flex md:flex-col items-start gap-4 opacity-60">
              <div className="w-10 h-10 bg-[#161616] border border-[#333] flex items-center justify-center text-[#737373] shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#737373] uppercase tracking-widest block">STEP 04 • FINAL LEG</span>
                <h3 className="text-sm font-semibold text-white">Doorstep Delivery</h3>
                <p className="text-xs text-[#10B981] font-semibold">{deliveryRangeStr}</p>
                <span className="text-[10px] text-[#737373]">Tamper-Proof Archival Packaging</span>
              </div>
            </div>
          </div>
        </section>

        {/* TWO-COLUMN GRID: ITEMS BREAKDOWN & SHIPPING INFO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: PURCHASED PIECES (7 Cols) */}
          <section className="lg:col-span-7 bg-[#121212] border border-[#262626] p-6 sm:p-8 flex flex-col gap-6 rounded-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
              <div>
                <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest block">CAPSULE ACQUISITION</span>
                <h2 className="font-brand text-lg sm:text-xl font-bold tracking-tight text-white uppercase">
                  PURCHASED PIECES ({items.length} {items.length === 1 ? "ITEM" : "ITEMS"})
                </h2>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#a1a1aa] border border-[#333] px-2.5 py-1">
                ARCHIVE DROP 2026
              </span>
            </div>

            {/* Items List */}
            <div className="divide-y divide-[#262626]">
              {items.map((item, idx) => {
                const itemPrice = Number(item.price?.amount || item.price || 1499);
                const itemQty = item.quantity || 1;
                const itemImg = typeof item.image === "string" ? item.image : (item.image?.url || item.images?.[0]?.url || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80");

                return (
                  <article key={idx} className="py-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-20 h-24 bg-[#1a1a1a] border border-[#333] shrink-0 overflow-hidden relative">
                        <img
                          src={itemImg}
                          alt={item.title || "Product"}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-1 left-1 bg-black/80 text-[#10B981] text-[8px] font-mono px-1 py-0.5">
                          PIECE 0{idx + 1}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">
                          STREETWEAR CAPSULE
                        </span>
                        <h3 className="text-sm font-bold text-white tracking-tight uppercase line-clamp-1">
                          {item.title || "Luxury Garment"}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
                          <span>Size: <strong className="text-white font-semibold">{item.selectedSize || "M"}</strong></span>
                          <span>•</span>
                          <span>Qty: <strong className="text-white font-semibold">{itemQty}</strong></span>
                        </div>
                        {item.description && (
                          <span className="text-[10px] text-[#737373] tracking-wide line-clamp-1">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right sm:self-center shrink-0 w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-t-0 pt-2 sm:pt-0 border-[#262626]">
                      <span className="text-base font-bold text-white">₹{(itemPrice * itemQty).toLocaleString("en-IN")}</span>
                      <span className="text-[9px] font-bold text-[#10B981] tracking-widest uppercase">VERIFIED IN STOCK</span>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Cost Ledger Breakdown */}
            <div className="border-t border-[#262626] pt-4 flex flex-col gap-2 bg-[#0e0e0e] p-4 rounded-sm">
              <div className="flex justify-between text-xs text-[#a1a1aa]">
                <span>Items Subtotal</span>
                <span className="text-white font-medium">₹{totalPaid.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-xs text-[#a1a1aa] items-center">
                <span className="flex items-center gap-1.5">
                  <span>Express Courier Shipping (Air 48h)</span>
                  <span className="text-[9px] px-1.5 py-0.2 bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 uppercase">
                    COMPLIMENTARY
                  </span>
                </span>
                <span className="text-[#10B981] font-semibold tracking-wider text-xs">FREE</span>
              </div>
              <div className="flex justify-between text-xs text-[#a1a1aa]">
                <span>Archival Dustbag & Gift Packaging</span>
                <span className="text-[#10B981] font-semibold tracking-wider text-xs">FREE</span>
              </div>
              <div className="flex justify-between text-xs text-[#a1a1aa]">
                <span>Integrated GST & Luxury Textile Cess</span>
                <span className="text-[#a1a1aa]">Included (12%)</span>
              </div>
              <div className="border-t border-[#262626] pt-3 mt-1 flex justify-between items-baseline">
                <div>
                  <span className="font-brand text-sm font-bold text-white tracking-tight uppercase">TOTAL AMOUNT PAID</span>
                  <span className="block text-[10px] text-[#737373] tracking-wider">ALL TAXES & TRANSIT INSURANCE PAID</span>
                </div>
                <span className="text-xl font-black text-white tracking-tight">₹{totalPaid.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: SHIPPING & AUTHENTICITY DETAILS (5 Cols) */}
          <section className="lg:col-span-5 flex flex-col gap-6">
            {/* Delivery Destination Card */}
            <div className="bg-[#121212] border border-[#262626] p-6 rounded-sm space-y-3">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">SHIPPING DESTINATION</h3>
                </div>
                <span className="text-[9px] font-bold text-[#D4AF37] border border-[#D4AF37]/40 px-2 py-0.5 uppercase">
                  VERIFIED ADDRESS
                </span>
              </div>
              <div className="pt-1">
                <h4 className="text-sm font-bold text-white">{user?.fullname || user?.name || "Aryan Mehta"}</h4>
                <p className="text-xs text-[#a1a1aa] leading-relaxed mt-1">
                  Penthouse 402, Signature One Heights,<br />
                  Pali Hill, Bandra West, Mumbai, MH – 400050<br />
                  India
                </p>
                <div className="border-t border-[#262626] pt-3 mt-3 space-y-1.5 text-xs text-[#a1a1aa]">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-white font-medium">{user?.contact || user?.phone || "+91 98201 44819"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-white font-medium">{user?.email || "customer@snitch.co.in"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Air Express Guarantee */}
            <div className="bg-[#121212] border border-[#262626] p-5 flex items-start gap-4 rounded-sm">
              <div className="w-10 h-10 border border-[#D4AF37]/40 bg-[#161616] flex items-center justify-center shrink-0 text-[#D4AF37]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest block">
                  AIR EXPRESS GUARANTEE
                </span>
                <h4 className="text-xs font-bold text-white mt-0.5">Express Air 48h Guaranteed Dispatch</h4>
                <p className="text-[11px] text-[#a1a1aa] mt-1 leading-normal">
                  Direct consignment via dedicated aviation corridors. Real-time temperature control and tamper detection seals applied.
                </p>
              </div>
            </div>

            {/* Authenticity Certificate */}
            <div className="bg-[#121212] border border-[#262626] p-5 flex items-start gap-4 rounded-sm">
              <div className="w-10 h-10 border border-[#10B981]/40 bg-[#161616] flex items-center justify-center shrink-0 text-[#10B981]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest block">
                  100% GENUINE GUARANTEE
                </span>
                <h4 className="text-xs font-bold text-white mt-0.5">SNITCH Archival Craftsmanship</h4>
                <p className="text-[11px] text-[#a1a1aa] mt-1 leading-normal">
                  Each article is stamped with a unique NFC serial verification tag. Includes Physical Archival Collector Card.
                </p>
              </div>
            </div>

            {/* 24/7 Concierge Support */}
            <div className="border border-[#262626] p-4 bg-[#0e0e0e] flex items-center justify-between rounded-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="text-xs text-[#a1a1aa]">Need immediate assistance?</span>
              </div>
              <a
                href="mailto:support@snitch.co.in"
                className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest hover:underline"
              >
                CONCIERGE 24/7
              </a>
            </div>
          </section>
        </div>

        {/* ORDER ACTIONS BAR */}
        <section className="border border-[#262626] bg-[#121212] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-4 rounded-sm">
          {/* Tactical Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Download Tax Invoice */}
            <button
              onClick={handlePrintInvoice}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 border border-[#333] text-white text-xs uppercase font-bold tracking-wider hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all bg-[#0e0e0e] rounded-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download Invoice (PDF)</span>
            </button>

            {/* Track Live Modal Trigger */}
            <button
              onClick={() => setShowTrackingModal(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 border border-[#333] text-white text-xs uppercase font-bold tracking-wider hover:border-[#10B981] hover:text-[#10B981] transition-all bg-[#0e0e0e] rounded-sm"
            >
              <svg className="w-4 h-4 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>Track Live Radar</span>
            </button>

            {/* Share Purchase */}
            <button
              onClick={handleSharePurchase}
              className="p-3 border border-[#333] text-[#a1a1aa] hover:text-white hover:border-white transition-all bg-[#0e0e0e] rounded-sm"
              title="Share Purchase"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>

          {/* Primary Action CTA */}
          <Link
            to="/"
            className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-brand text-xs uppercase font-extrabold tracking-[0.14em] hover:bg-[#10B981] hover:text-black transition-all duration-200 rounded-sm"
          >
            <span>CONTINUE SHOPPING / EXPLORE NEW DROPS</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </section>
      </div>

      {/* TRACKING RADAR MODAL */}
      {showTrackingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[#121212] border border-[#262626] max-w-lg w-full p-6 sm:p-8 rounded shadow-2xl relative space-y-6">
            <button
              onClick={() => setShowTrackingModal(false)}
              className="absolute top-4 right-4 text-[#a1a1aa] hover:text-white text-lg p-1"
            >
              ✕
            </button>

            <div>
              <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest block">
                LIVE TELEMETRY RADAR
              </span>
              <h3 className="font-brand text-xl font-bold text-white uppercase mt-0.5">
                AIRWAY WAYBILL: #{orderId}
              </h3>
            </div>

            <div className="space-y-4 border-l-2 border-[#10B981] pl-4 my-4">
              <div className="space-y-0.5">
                <span className="text-[10px] text-[#10B981] font-bold uppercase">JUST NOW • DISPATCH HUB</span>
                <p className="text-xs text-white font-medium">Order confirmed & encrypted payment validated.</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-[#D4AF37] font-bold uppercase">NEXT UP • 08:00 IST TOMORROW</span>
                <p className="text-xs text-[#a1a1aa]">Quality Assurance & NFC authenticity chip verification.</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-[#737373] font-bold uppercase">ESTIMATED TRANSIT</span>
                <p className="text-xs text-[#a1a1aa]">BlueDart Priority Air Cargo → Doorstep delivery within {deliveryRangeStr}.</p>
              </div>
            </div>

            <button
              onClick={() => setShowTrackingModal(false)}
              className="w-full py-3 bg-white text-black font-brand text-xs uppercase font-bold tracking-wider hover:bg-[#10B981] transition-colors rounded-sm"
            >
              CLOSE RADAR VIEW
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
