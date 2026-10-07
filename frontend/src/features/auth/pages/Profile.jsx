import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router";
import { setUser } from "../state/auth.slice";
import { 
  getMe, 
  updateProfileApi, 
  getAddressesApi, 
  addAddressApi, 
  updateAddressApi, 
  deleteAddressApi, 
  setDefaultAddressApi, 
  changePasswordApi,
  updatePreferencesApi 
} from "../service/auth.api";
import { 
  getUserOrdersApi, 
  addItem as addCartItemApi,
  cancelOrderApi,
  returnOrderApi
} from "../../cart/services/cart.api";
import { addItem as addReduxCartItem } from "../../cart/state/cart.slice";
import { useWishlist } from "../../products/hooks/useWishlist";

export default function Profile() {
  const authUser = useSelector((state) => state.auth?.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get("tab") || "orders";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Profile User State
  const [profileData, setProfileData] = useState({
    fullname: authUser?.fullname || "",
    email: authUser?.email || "",
    contact: authUser?.contact || "",
    bio: authUser?.bio || "",
    profilepic: authUser?.profilepic || "",
    role: authUser?.role || "buyer"
  });

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrderTracking, setSelectedOrderTracking] = useState(null);

  // Cancel Order Modal State
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState("Ordered by mistake");
  const [cancelComment, setCancelComment] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Return / Exchange Modal State
  const [returnModalOrder, setReturnModalOrder] = useState(null);
  const [returnReason, setReturnReason] = useState("Size Too Small / Large");
  const [returnAction, setReturnAction] = useState("refund");
  const [returnExchangeSize, setReturnExchangeSize] = useState("L");
  const [returnComment, setReturnComment] = useState("");
  const [returnPickupAddress, setReturnPickupAddress] = useState("");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Addresses State
  const [addresses, setAddresses] = useState(authUser?.addresses || []);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    tag: "Home",
    isDefault: false
  });

  // Wishlist State (via hook)
  const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();

  // Settings State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [preferences, setPreferences] = useState(authUser?.preferences || {
    emailNotifications: true,
    smsUpdates: true,
    twoFactor: false,
    darkTheme: true
  });

  // UI state
  const [toast, setToast] = useState(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Sync tab with URL search parameter
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sync user profile from backend on mount
  useEffect(() => {
    async function loadUserData() {
      try {
        const res = await getMe();
        if (res?.user) {
          dispatch(setUser(res.user));
          setProfileData({
            fullname: res.user.fullname || "",
            email: res.user.email || "",
            contact: res.user.contact || "",
            bio: res.user.bio || "",
            profilepic: res.user.profilepic || "",
            role: res.user.role || "buyer"
          });
          if (res.user.addresses) setAddresses(res.user.addresses);
          if (res.user.preferences) setPreferences(res.user.preferences);
        }
      } catch {
        // use authUser fallback
      }
    }
    loadUserData();
  }, [dispatch]);

  // Load Orders
  useEffect(() => {
    async function fetchOrders() {
      setLoadingOrders(true);
      try {
        const res = await getUserOrdersApi();
        if (res?.success && Array.isArray(res.orders)) {
          setOrders(res.orders);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.warn("Failed to fetch orders:", err);
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    }
    fetchOrders();
  }, []);

  // Open Cancel Modal
  const handleOpenCancelModal = (order) => {
    setCancelModalOrder(order);
    setCancelReason("Ordered by mistake");
    setCancelComment("");
  };

  // Confirm Cancel Order
  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!cancelModalOrder) return;
    setIsCancelling(true);
    const targetId = cancelModalOrder.razorpay?.orderId || cancelModalOrder._id;
    try {
      const res = await cancelOrderApi(targetId, { reason: cancelReason, comment: cancelComment });
      if (res?.success) {
        setOrders(prev => prev.map(o => (o._id === cancelModalOrder._id || o.razorpay?.orderId === targetId) ? {
          ...o,
          status: "cancelled",
          cancellation: {
            reason: cancelReason,
            comment: cancelComment,
            cancelledAt: new Date(),
            refundStatus: "processed",
            refundAmount: o.price?.amount || 0
          }
        } : o));
        showToast("Order cancelled successfully! 100% refund initiated to source payment.");
        setCancelModalOrder(null);
      } else {
        showToast(res?.message || "Failed to cancel order", "error");
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Cancellation request failed", "error");
    } finally {
      setIsCancelling(false);
    }
  };

  // Open Return Modal
  const handleOpenReturnModal = (order) => {
    setReturnModalOrder(order);
    setReturnReason("Size Too Small / Large");
    setReturnAction("refund");
    setReturnExchangeSize("L");
    setReturnComment("");
    setReturnPickupAddress(
      addresses.find(a => a.isDefault)?.street
        ? `${addresses.find(a => a.isDefault).street}, ${addresses.find(a => a.isDefault).city}`
        : (addresses[0]?.street ? `${addresses[0].street}, ${addresses[0].city}` : "Primary Registered Address")
    );
  };

  // Confirm Return / Exchange Order
  const handleConfirmReturn = async (e) => {
    e.preventDefault();
    if (!returnModalOrder) return;
    setIsSubmittingReturn(true);
    const targetId = returnModalOrder.razorpay?.orderId || returnModalOrder._id;
    try {
      const res = await returnOrderApi(targetId, {
        reason: returnReason,
        action: returnAction,
        exchangeSize: returnAction === "exchange" ? returnExchangeSize : "",
        comment: returnComment,
        pickupAddress: returnPickupAddress || "Primary Registered Address"
      });
      if (res?.success) {
        setOrders(prev => prev.map(o => (o._id === returnModalOrder._id || o.razorpay?.orderId === targetId) ? {
          ...o,
          status: "return_requested",
          returnRequest: {
            reason: returnReason,
            action: returnAction,
            exchangeSize: returnAction === "exchange" ? returnExchangeSize : "",
            comment: returnComment,
            pickupAddress: returnPickupAddress,
            requestedAt: new Date(),
            status: "requested"
          }
        } : o));
        showToast(returnAction === "exchange" 
          ? "Exchange request submitted! Reverse pickup courier scheduled." 
          : "Return request submitted! Reverse pickup courier scheduled.");
        setReturnModalOrder(null);
      } else {
        showToast(res?.message || "Failed to submit return request", "error");
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Return request failed", "error");
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const res = await updateProfileApi(profileData);
      if (res?.success && res.user) {
        dispatch(setUser(res.user));
        showToast("Profile details updated successfully!");
      } else {
        showToast(res?.message || "Failed to update profile", "error");
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Error updating profile", "error");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Password Save
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("New passwords do not match!", "error");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast("Password must be at least 6 characters!", "error");
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await changePasswordApi({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (res?.success) {
        showToast("Password changed successfully!");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        showToast(res?.message || "Failed to change password", "error");
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Error changing password", "error");
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Preferences Toggle
  const handleTogglePreference = async (key) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    try {
      await updatePreferencesApi(updated);
      showToast("Preference saved!");
    } catch {
      showToast("Failed to save preference", "error");
    }
  };

  // Address Actions
  const handleOpenAddressModal = (addr = null) => {
    if (addr) {
      setEditingAddressId(addr._id);
      setAddressForm({
        fullName: addr.fullName || "",
        phone: addr.phone || "",
        street: addr.street || "",
        city: addr.city || "",
        state: addr.state || "",
        pincode: addr.pincode || "",
        landmark: addr.landmark || "",
        tag: addr.tag || "Home",
        isDefault: addr.isDefault || false
      });
    } else {
      setEditingAddressId(null);
      setAddressForm({
        fullName: profileData.fullname || "",
        phone: profileData.contact || "",
        street: "",
        city: "",
        state: "",
        pincode: "",
        landmark: "",
        tag: "Home",
        isDefault: addresses.length === 0
      });
    }
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      if (editingAddressId) {
        const res = await updateAddressApi(editingAddressId, addressForm);
        if (res?.success) {
          setAddresses(res.addresses);
          showToast("Address updated successfully!");
        }
      } else {
        const res = await addAddressApi(addressForm);
        if (res?.success) {
          setAddresses(res.addresses);
          showToast("Address added successfully!");
        }
      }
      setShowAddressModal(false);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to save address", "error");
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      const res = await deleteAddressApi(addressId);
      if (res?.success) {
        setAddresses(res.addresses);
        showToast("Address deleted!");
      }
    } catch {
      showToast("Failed to delete address", "error");
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const res = await setDefaultAddressApi(addressId);
      if (res?.success) {
        setAddresses(res.addresses);
        showToast("Set as default address!");
      }
    } catch {
      showToast("Failed to set default address", "error");
    }
  };

  // Move Wishlist item to Cart
  const handleMoveToCart = async (item) => {
    const pId = item._id || item.id || item.product;
    const cartItem = {
      _id: pId,
      id: pId,
      title: item.title,
      price: item.price,
      selectedSize: item.selectedSize || "M",
      quantity: 1,
      image: item.image || item.images?.[0]
    };

    dispatch(addReduxCartItem(cartItem));
    await addCartItemApi({
      productId: pId,
      quantity: 1,
      selectedSize: item.selectedSize || "M",
      price: item.price,
      title: item.title,
      image: item.image
    });

    removeFromWishlist(pId);
    showToast(`Added "${item.title}" to Bag!`);
  };

  const handleLogout = () => {
    dispatch(setUser(null));
    navigate("/login");
  };

  // Get Initials for Avatar
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 selection:bg-[#10B981] selection:text-black pt-20 pb-24 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-md shadow-2xl border flex items-center gap-3 animate-in slide-in-from-bottom-5 ${
          toast.type === "error" 
            ? "bg-rose-950/90 border-rose-600 text-rose-200" 
            : "bg-neutral-900 border-[#10B981] text-white"
        }`}>
          <span className={`w-2 h-2 rounded-full ${toast.type === "error" ? "bg-rose-500" : "bg-[#10B981]"} animate-ping`} />
          <span className="text-xs font-bold uppercase tracking-wider">{toast.message}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8">
        {/* ================================================================ */}
        {/* 1. CIRCULAR PROFILE HERO HEADER */}
        {/* ================================================================ */}
        <div className="relative bg-gradient-to-b from-[#161616] to-[#111111] border border-neutral-800 rounded-2xl p-6 sm:p-8 overflow-hidden shadow-2xl">
          {/* Subtle Ambient Background Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#10B981]/10 blur-[100px] pointer-events-none rounded-full" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#D4AF37]/10 blur-[100px] pointer-events-none rounded-full" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            {/* Circular Profile Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              {/* High-End Circular Profile Avatar with Glowing Halo */}
              <div className="relative group">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-[3px] bg-gradient-to-tr from-[#10B981] via-amber-400 to-[#38BDF8] shadow-[0_0_35px_rgba(16,185,129,0.35)] group-hover:shadow-[0_0_45px_rgba(16,185,129,0.6)] group-hover:scale-105 transition-all duration-300">
                  <div className="w-full h-full rounded-full bg-[#0d0d0d] p-[2px] overflow-hidden flex items-center justify-center border-2 border-black/80 shadow-inner">
                    {profileData.profilepic ? (
                      <img
                        src={profileData.profilepic}
                        alt={profileData.fullname}
                        className="w-full h-full rounded-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-b from-neutral-800 to-neutral-950 flex items-center justify-center text-3xl sm:text-4xl font-black font-brand tracking-widest text-white group-hover:text-[#10B981] transition-colors">
                        {getInitials(profileData.fullname)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Online / Active Pulse Indicator */}
                <div className="absolute bottom-1 right-1 flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-5 w-5 rounded-full bg-[#10B981] opacity-75" />
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-[#10B981] border-2 border-black items-center justify-center shadow-lg">
                    <span className="w-1.5 h-1.5 bg-black rounded-full" />
                  </span>
                </div>

                {/* Quick Edit Avatar Button */}
                <button
                  type="button"
                  onClick={() => handleTabChange("settings")}
                  className="absolute top-0 right-0 w-7 h-7 rounded-full bg-neutral-900 border border-neutral-700 hover:border-[#10B981] text-neutral-400 hover:text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all shadow-lg cursor-pointer"
                  title="Edit Avatar in Settings"
                >
                  ✎
                </button>
              </div>

              {/* User Bio & Identity */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black font-brand tracking-tight text-white uppercase">
                    {profileData.fullname || "SNITCH Member"}
                  </h1>
                  <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest rounded-full border ${
                    profileData.role === "seller"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      : "bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]"
                  }`}>
                    {profileData.role === "seller" ? "⭐ Verified Seller" : "💎 VIP Member"}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-neutral-400 flex items-center justify-center sm:justify-start gap-2">
                  <span>{profileData.email || "No email linked"}</span>
                  {profileData.contact && (
                    <>
                      <span>•</span>
                      <span>{profileData.contact}</span>
                    </>
                  )}
                </p>

                {profileData.bio ? (
                  <p className="text-xs text-neutral-500 italic max-w-md pt-1">
                    "{profileData.bio}"
                  </p>
                ) : (
                  <p className="text-xs text-neutral-500 max-w-md pt-0.5">
                    Welcome back to your luxury streetwear hub. Track your drops, saved pieces & address settings.
                  </p>
                )}
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-3 sm:gap-4 bg-black/40 border border-neutral-800/80 p-3 sm:p-4 rounded-xl backdrop-blur-sm self-stretch md:self-auto justify-around">
              <div className="text-center px-2">
                <span className="block text-lg sm:text-xl font-black text-white">{orders.length}</span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Orders</span>
              </div>
              <div className="h-8 w-[1px] bg-neutral-800" />
              <div className="text-center px-2">
                <span className="block text-lg sm:text-xl font-black text-rose-400">{wishlistItems.length}</span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Wishlist</span>
              </div>
              <div className="h-8 w-[1px] bg-neutral-800" />
              <div className="text-center px-2">
                <span className="block text-lg sm:text-xl font-black text-amber-400">{addresses.length}</span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Addresses</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 2. NAVIGATION TABS */}
        {/* ================================================================ */}
        <div className="flex items-center gap-2 border-b border-neutral-800 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: "orders", label: "My Orders", icon: "📦", count: orders.length },
            { id: "wishlist", label: "Saved Wishlist", icon: "❤️", count: wishlistItems.length },
            { id: "addresses", label: "Addresses", icon: "📍", count: addresses.length },
            { id: "settings", label: "Settings", icon: "⚙️" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-white text-black shadow-lg shadow-white/10 scale-102"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                    isActive ? "bg-black text-white" : "bg-neutral-800 text-neutral-300"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ================================================================ */}
        {/* 3. TAB CONTENTS */}
        {/* ================================================================ */}

        {/* --- TAB: ORDERS --- */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black font-brand uppercase text-white tracking-tight">
                  ORDER HISTORY & RECENT DROPS
                </h2>
                <p className="text-xs text-neutral-400">
                  Track, reorder and inspect invoices for all your SNITCH purchases.
                </p>
              </div>

              <Link
                to="/"
                className="self-start sm:self-auto px-4 py-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-600 text-neutral-200 hover:text-white text-xs font-bold uppercase tracking-wider rounded-md transition-colors"
              >
                Explore New Drops →
              </Link>
            </div>

            {loadingOrders ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-10 h-10 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Loading orders from vault...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-[#121212] border border-neutral-800/80 rounded-xl p-12 text-center space-y-5">
                <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center mx-auto text-2xl text-neutral-400">
                  🛍️
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white uppercase">No Orders Placed Yet</h3>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                    Your luxury streetwear collection awaits. Browse our curated shirts, tees, cargos, and jackets.
                  </p>
                </div>
                <Link
                  to="/"
                  className="inline-block px-6 py-3 bg-white text-black font-brand text-xs font-black uppercase tracking-widest rounded-md hover:bg-[#10B981] hover:text-black transition-colors"
                >
                  Start Shopping Now
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order, orderIdx) => {
                  const orderId = order.razorpay?.orderId || order._id;
                  const orderDate = order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })
                    : "Recent";
                  const orderItems = order.orderItems || [];
                  const orderTotal = order.price?.amount || 0;
                  const isPaid = order.status === "paid" || order.status === "completed";

                  return (
                    <div
                      key={order._id || orderIdx}
                      className="bg-[#121212] border border-neutral-800 rounded-xl overflow-hidden shadow-xl hover:border-neutral-700 transition-colors"
                    >
                      {/* Order Header */}
                      <div className="bg-neutral-900/90 px-5 sm:px-6 py-4 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-4">
                          <div>
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">ORDER ID</span>
                            <span className="text-xs font-mono font-bold text-white">{orderId}</span>
                          </div>
                          <div className="h-6 w-[1px] bg-neutral-800 hidden sm:block" />
                          <div>
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">DATE PLACED</span>
                            <span className="text-xs font-semibold text-neutral-300">{orderDate}</span>
                          </div>
                          <div className="h-6 w-[1px] bg-neutral-800 hidden sm:block" />
                          <div>
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">TOTAL</span>
                            <span className="text-xs font-black text-white">₹{orderTotal.toLocaleString("en-IN")}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          {order.status === "cancelled" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-rose-950/70 border-rose-500/50 text-rose-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                              CANCELLED & REFUNDED
                            </span>
                          ) : order.status === "return_requested" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-cyan-950/70 border-cyan-500/50 text-cyan-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                              RETURN / EXCHANGE REQUESTED
                            </span>
                          ) : isPaid ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-emerald-950/60 border-emerald-500/40 text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              PAID & CONFIRMED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-amber-950/60 border-amber-500/40 text-amber-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              {order.status?.toUpperCase() || "PROCESSING"}
                            </span>
                          )}

                          <button
                            onClick={() => setSelectedOrderTracking(order)}
                            className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-bold uppercase rounded border border-neutral-700 transition-colors cursor-pointer"
                          >
                            Live Radar 📡
                          </button>
                        </div>
                      </div>

                      {/* Cancellation / Return Banner if applicable */}
                      {order.status === "cancelled" && (
                        <div className="bg-rose-950/30 border-b border-rose-900/40 px-5 sm:px-6 py-2.5 flex items-center justify-between text-xs text-rose-300">
                          <div className="flex items-center gap-2">
                            <span>❌</span>
                            <span>
                              <strong>Order Cancelled</strong> • Reason: <em>"{order.cancellation?.reason || "Cancelled by Customer"}"</em>
                              {order.cancellation?.comment && ` (${order.cancellation.comment})`}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                            ₹{orderTotal.toLocaleString("en-IN")} Refund Processed
                          </span>
                        </div>
                      )}

                      {order.status === "return_requested" && (
                        <div className="bg-cyan-950/30 border-b border-cyan-900/40 px-5 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-cyan-300">
                          <div className="flex items-center gap-2">
                            <span>🔄</span>
                            <span>
                              <strong>{order.returnRequest?.action === "exchange" ? "Exchange in Progress" : "Return Request Active"}</strong>
                              {order.returnRequest?.action === "exchange" && ` • Exchange for Size: ${order.returnRequest?.exchangeSize || "M"}`}
                              {` • Reason: "${order.returnRequest?.reason || "Size / Quality"}"`}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                            Reverse Courier Scheduled
                          </span>
                        </div>
                      )}

                      {/* Items List in Order */}
                      <div className="p-5 sm:p-6 divide-y divide-neutral-800/60">
                        {orderItems.map((item, itemIdx) => {
                          const itemImg = item.images?.[0]?.url || item.image || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80";
                          const itemPrice = item.price?.amount || item.price || 1499;

                          return (
                            <div key={itemIdx} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-20 bg-neutral-900 rounded border border-neutral-800 overflow-hidden shrink-0">
                                  <img
                                    src={itemImg}
                                    alt={item.title || "Product"}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-sm font-bold text-white uppercase tracking-tight">
                                    {item.title || "Luxury Garment"}
                                  </h4>
                                  <p className="text-xs text-neutral-400">
                                    Qty: <strong className="text-white">{item.quantity || 1}</strong>
                                    {item.selectedSize && <> • Size: <strong className="text-white">{item.selectedSize}</strong></>}
                                  </p>
                                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                                    NFC Tamper Sealed
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-800">
                                <span className="text-sm font-bold text-white">
                                  ₹{(Number(itemPrice) * (item.quantity || 1)).toLocaleString("en-IN")}
                                </span>
                                <Link
                                  to={`/product/${item.productId || ""}`}
                                  className="px-3 py-1.5 bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white text-[11px] font-semibold rounded hover:bg-neutral-800 transition-colors"
                                >
                                  View Item
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Order Footer Actions & Return/Cancel Controls */}
                      <div className="bg-neutral-950/80 px-5 sm:px-6 py-3.5 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-400">
                        <div className="flex items-center gap-2">
                          <span>Courier: <strong>BlueDart Express Air</strong></span>
                          <span>•</span>
                          <span>Delivery: <strong>2-4 Business Days</strong></span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                          {/* Cancel Order Trigger */}
                          {order.status !== "cancelled" && order.status !== "return_requested" && (
                            <button
                              onClick={() => handleOpenCancelModal(order)}
                              className="px-3.5 py-1.5 bg-rose-950/40 hover:bg-rose-950/80 border border-rose-900/60 hover:border-rose-600 text-rose-300 text-xs font-bold uppercase rounded transition-colors cursor-pointer"
                            >
                              Cancel Order
                            </button>
                          )}

                          {/* Return / Exchange Trigger */}
                          {order.status !== "cancelled" && order.status !== "return_requested" && (
                            <button
                              onClick={() => handleOpenReturnModal(order)}
                              className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-[#10B981] text-neutral-200 hover:text-white text-xs font-bold uppercase rounded transition-colors cursor-pointer"
                            >
                              Return / Exchange
                            </button>
                          )}

                          <button
                            onClick={() => window.print()}
                            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white text-xs font-semibold rounded transition-colors cursor-pointer"
                          >
                            Receipt (PDF)
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- TAB: WISHLIST --- */}
        {activeTab === "wishlist" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black font-brand uppercase text-white tracking-tight">
                  SAVED WISHLIST CAPSULES ({wishlistItems.length})
                </h2>
                <p className="text-xs text-neutral-400">
                  Your curated luxury pieces. Move them to your cart before drop stocks run out.
                </p>
              </div>

              {wishlistItems.length > 0 && (
                <button
                  onClick={clearWishlist}
                  className="self-start sm:self-auto px-4 py-2 border border-rose-900/50 hover:border-rose-600 text-rose-400 hover:text-rose-300 text-xs font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer"
                >
                  Clear Wishlist
                </button>
              )}
            </div>

            {wishlistItems.length === 0 ? (
              <div className="bg-[#121212] border border-neutral-800/80 rounded-xl p-12 text-center space-y-5">
                <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center mx-auto text-2xl text-rose-500">
                  ❤️
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white uppercase">Your Wishlist is Empty</h3>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                    Explore our exclusive streetwear collections and tap the heart icon to save pieces here.
                  </p>
                </div>
                <Link
                  to="/"
                  className="inline-block px-6 py-3 bg-white text-black font-brand text-xs font-black uppercase tracking-widest rounded-md hover:bg-[#10B981] hover:text-black transition-colors"
                >
                  Explore Collections
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistItems.map((item, idx) => {
                  const pId = item._id || item.id || item.product;
                  const itemImg = item.image || item.images?.[0]?.url || item.images?.[0] || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80";
                  const itemPrice = item.price?.amount || item.price || 1499;

                  return (
                    <div
                      key={pId || idx}
                      className="bg-[#121212] border border-neutral-800 rounded-xl overflow-hidden flex flex-col group hover:border-neutral-700 transition-all shadow-lg"
                    >
                      {/* Product Image */}
                      <div className="relative aspect-[3/4] bg-neutral-900 overflow-hidden">
                        <img
                          src={itemImg}
                          alt={item.title || "Product"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <button
                          onClick={() => removeFromWishlist(pId)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm border border-neutral-700 text-rose-400 hover:text-white hover:bg-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                          title="Remove from wishlist"
                        >
                          ✕
                        </button>
                        <span className="absolute bottom-3 left-3 px-2 py-0.5 bg-black/80 backdrop-blur-sm text-[9px] font-bold tracking-widest text-[#10B981] uppercase rounded">
                          IN STOCK
                        </span>
                      </div>

                      {/* Product Details */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">
                            STREETWEAR CAPSULE
                          </span>
                          <h3 className="text-sm font-bold text-white uppercase tracking-tight line-clamp-1">
                            {item.title || "Garment Piece"}
                          </h3>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-base font-black text-white">
                              ₹{Number(itemPrice).toLocaleString("en-IN")}
                            </span>
                            <span className="text-xs text-neutral-400">
                              Size: <strong>{item.selectedSize || "M"}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Move to Bag Action */}
                        <div className="flex gap-2 pt-2 border-t border-neutral-800">
                          <button
                            onClick={() => handleMoveToCart(item)}
                            className="flex-1 py-2.5 bg-white text-black text-xs font-black uppercase tracking-wider rounded hover:bg-[#10B981] hover:text-black transition-colors flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>Move to Bag</span>
                            <span>→</span>
                          </button>
                          <Link
                            to={`/product/${pId}`}
                            className="px-3 py-2.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-bold rounded hover:bg-neutral-800 transition-colors"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- TAB: ADDRESSES --- */}
        {activeTab === "addresses" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black font-brand uppercase text-white tracking-tight">
                  SAVED DELIVERY DESTINATIONS ({addresses.length})
                </h2>
                <p className="text-xs text-neutral-400">
                  Manage your home, studio, and workplace shipping addresses for rapid checkout.
                </p>
              </div>

              <button
                onClick={() => handleOpenAddressModal()}
                className="self-start sm:self-auto px-5 py-2.5 bg-white text-black hover:bg-[#10B981] text-xs font-black uppercase tracking-wider rounded-md transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>+ Add New Address</span>
              </button>
            </div>

            {loadingAddresses ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-10 h-10 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-neutral-400">Fetching addresses...</p>
              </div>
            ) : addresses.length === 0 ? (
              <div className="bg-[#121212] border border-neutral-800/80 rounded-xl p-12 text-center space-y-5">
                <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center mx-auto text-2xl text-amber-400">
                  📍
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white uppercase">No Saved Addresses Found</h3>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                    Add a primary delivery address to enjoy 1-click expedited checkout.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenAddressModal()}
                  className="px-6 py-3 bg-white text-black font-brand text-xs font-black uppercase tracking-widest rounded-md hover:bg-[#10B981] hover:text-black transition-colors cursor-pointer"
                >
                  Add Primary Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addresses.map((addr, idx) => (
                  <div
                    key={addr._id || idx}
                    className={`bg-[#121212] border rounded-xl p-6 relative flex flex-col justify-between space-y-4 transition-colors ${
                      addr.isDefault
                        ? "border-[#10B981]/60 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                        : "border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Address Tag & Default Status */}
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 bg-neutral-900 border border-neutral-700 text-neutral-300 text-[10px] font-black uppercase tracking-wider rounded">
                          {addr.tag || "Home"}
                        </span>

                        {addr.isDefault ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#10B981] uppercase tracking-wider bg-[#10B981]/10 px-2.5 py-0.5 rounded-full border border-[#10B981]/30">
                            ★ Default Address
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetDefaultAddress(addr._id)}
                            className="text-[10px] text-neutral-400 hover:text-white uppercase tracking-wider underline cursor-pointer"
                          >
                            Set as Default
                          </button>
                        )}
                      </div>

                      {/* Recipient details */}
                      <div>
                        <h3 className="text-base font-bold text-white uppercase tracking-tight">
                          {addr.fullName}
                        </h3>
                        <p className="text-xs text-neutral-400 font-mono mt-0.5">
                          📞 {addr.phone}
                        </p>
                      </div>

                      {/* Street & Location */}
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        {addr.street}
                        {addr.landmark && <span className="block text-neutral-500">Landmark: {addr.landmark}</span>}
                        <span className="block font-semibold mt-1">
                          {addr.city}, {addr.state} – {addr.pincode}
                        </span>
                        <span className="block text-neutral-500">{addr.country || "India"}</span>
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-3 text-xs">
                      <button
                        onClick={() => handleOpenAddressModal(addr)}
                        className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-semibold rounded transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr._id)}
                        className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-950/80 border border-rose-900/60 text-rose-400 text-xs font-semibold rounded transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB: SETTINGS --- */}
        {activeTab === "settings" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-black font-brand uppercase text-white tracking-tight">
                ACCOUNT SETTINGS & SECURITY
              </h2>
              <p className="text-xs text-neutral-400">
                Update personal information, change authentication credentials, and configure notifications.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Profile Details Form */}
              <div className="bg-[#121212] border border-neutral-800 rounded-xl p-6 sm:p-8 space-y-6">
                <div className="border-b border-neutral-800 pb-3">
                  <h3 className="text-base font-bold text-white uppercase tracking-tight">
                    Personal Information
                  </h3>
                  <span className="text-xs text-neutral-500">Basic details linked to your SNITCH account</span>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.fullname}
                      onChange={(e) => setProfileData({ ...profileData, fullname: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white placeholder-neutral-600 focus:border-[#10B981] outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                      Email Address (Locked)
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-900 rounded text-xs text-neutral-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.contact}
                      onChange={(e) => setProfileData({ ...profileData, contact: e.target.value })}
                      placeholder="+91 98201 44819"
                      className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white placeholder-neutral-600 focus:border-[#10B981] outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                      Profile Avatar URL (Optional Image)
                    </label>
                    <input
                      type="url"
                      value={profileData.profilepic}
                      onChange={(e) => setProfileData({ ...profileData, profilepic: e.target.value })}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white placeholder-neutral-600 focus:border-[#10B981] outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                      Personal Bio / Signature
                    </label>
                    <textarea
                      rows={2}
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      placeholder="Streetwear enthusiast & capsule collector."
                      className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded text-xs text-white placeholder-neutral-600 focus:border-[#10B981] outline-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="w-full py-3 bg-white text-black font-brand text-xs font-black uppercase tracking-wider rounded hover:bg-[#10B981] hover:text-black transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isUpdatingProfile ? "Saving Changes..." : "Save Profile Details"}
                  </button>
                </form>
              </div>

              {/* Password & Security Card */}
              <div className="space-y-8">
                <div className="bg-[#121212] border border-neutral-800 rounded-xl p-6 sm:p-8 space-y-6">
                  <div className="border-b border-neutral-800 pb-3">
                    <h3 className="text-base font-bold text-white uppercase tracking-tight">
                      Security & Password
                    </h3>
                    <span className="text-xs text-neutral-500">Update your login security credentials</span>
                  </div>

                  <form onSubmit={handleSavePassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white placeholder-neutral-600 focus:border-[#10B981] outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder="Min. 6 characters"
                        required
                        className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white placeholder-neutral-600 focus:border-[#10B981] outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder="Re-enter new password"
                        required
                        className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white placeholder-neutral-600 focus:border-[#10B981] outline-none transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingPassword}
                      className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-brand text-xs font-bold uppercase tracking-wider rounded border border-neutral-700 transition-colors cursor-pointer"
                    >
                      {isSavingPassword ? "Updating Password..." : "Update Password"}
                    </button>
                  </form>
                </div>

                {/* Notifications & Preferences */}
                <div className="bg-[#121212] border border-neutral-800 rounded-xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                    Notifications & Privacy
                  </h3>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-neutral-900/80 rounded border border-neutral-800 cursor-pointer">
                      <span className="text-xs text-neutral-300 font-medium">Email Dispatch & Drop Alerts</span>
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications}
                        onChange={() => handleTogglePreference("emailNotifications")}
                        className="accent-[#10B981] w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-neutral-900/80 rounded border border-neutral-800 cursor-pointer">
                      <span className="text-xs text-neutral-300 font-medium">SMS Order Tracking Updates</span>
                      <input
                        type="checkbox"
                        checked={preferences.smsUpdates}
                        onChange={() => handleTogglePreference("smsUpdates")}
                        className="accent-[#10B981] w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-neutral-900/80 rounded border border-neutral-800 cursor-pointer">
                      <span className="text-xs text-neutral-300 font-medium">2-Factor Security Verification</span>
                      <input
                        type="checkbox"
                        checked={preferences.twoFactor}
                        onChange={() => handleTogglePreference("twoFactor")}
                        className="accent-[#10B981] w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="p-6 bg-rose-950/20 border border-rose-900/40 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Account Session</h4>
                    <p className="text-[11px] text-neutral-400">Sign out across all devices on this browser</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-rose-950 border border-rose-800 text-rose-300 hover:bg-rose-900 text-xs font-bold uppercase rounded transition-colors cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* 4. ADDRESS MODAL (ADD / EDIT) */}
      {/* ================================================================ */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-neutral-800 max-w-lg w-full p-6 sm:p-8 rounded-2xl shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddressModal(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-white text-lg p-1"
            >
              ✕
            </button>

            <div>
              <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest block">
                DELIVERY DESTINATION
              </span>
              <h3 className="text-xl font-black font-brand uppercase text-white tracking-tight">
                {editingAddressId ? "Edit Address" : "Add New Address"}
              </h3>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-xs text-white outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-xs text-white outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                  Street Address, Flat / Building *
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  placeholder="e.g. 402, High Street Towers, Linking Road"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-xs text-white outline-none focus:border-[#10B981]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="Mumbai"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-xs text-white outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    placeholder="Maharashtra"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-xs text-white outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    placeholder="400050"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-xs text-white outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={addressForm.landmark}
                    onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                    placeholder="Near City Mall"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-xs text-white outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>

              {/* Tag Selector */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Address Type / Label
                </label>
                <div className="flex gap-3">
                  {["Home", "Work", "Other"].map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => setAddressForm({ ...addressForm, tag })}
                      className={`flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider border cursor-pointer ${
                        addressForm.tag === tag
                          ? "bg-white text-black border-white"
                          : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Set as Default Checkbox */}
              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="accent-[#10B981] w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-neutral-300 font-medium">Set as default shipping address</span>
              </label>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-3 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-bold uppercase rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-white hover:bg-[#10B981] text-black font-brand text-xs font-black uppercase tracking-wider rounded transition-colors cursor-pointer"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 5. LIVE ORDER RADAR TRACKING MODAL */}
      {/* ================================================================ */}
      {selectedOrderTracking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-neutral-800 max-w-lg w-full p-6 sm:p-8 rounded-2xl shadow-2xl space-y-6 relative">
            <button
              onClick={() => setSelectedOrderTracking(null)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-white text-lg p-1"
            >
              ✕
            </button>

            <div>
              <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest block">
                LIVE DISPATCH RADAR
              </span>
              <h3 className="text-xl font-black font-brand uppercase text-white tracking-tight">
                TRACKING: #{selectedOrderTracking.razorpay?.orderId || selectedOrderTracking._id}
              </h3>
            </div>

            {/* 4-Step Timeline */}
            <div className="space-y-4 border-l-2 border-[#10B981] pl-4 my-4">
              <div className="space-y-0.5">
                <span className="text-[10px] text-[#10B981] font-black uppercase tracking-wider">
                  ✓ STEP 1: PAYMENT SECURED & AUTHORIZED
                </span>
                <p className="text-xs text-white font-medium">Order confirmed with encrypted transaction receipt.</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-[#D4AF37] font-black uppercase tracking-wider">
                  ⚡ STEP 2: MASTER QUALITY CHECK & SEAL
                </span>
                <p className="text-xs text-neutral-300 font-medium">NFC authenticity tag inspection in progress.</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-neutral-400 font-black uppercase tracking-wider">
                  ✈️ STEP 3: BLUE DART PRIORITY AIR DISPATCH
                </span>
                <p className="text-xs text-neutral-400">Transit hub departure Mumbai Corridor.</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-neutral-500 font-black uppercase tracking-wider">
                  📍 STEP 4: DOORSTEP DELIVERY
                </span>
                <p className="text-xs text-neutral-500">Estimated within 2-4 business days.</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrderTracking(null)}
              className="w-full py-3 bg-white text-black font-brand text-xs font-black uppercase tracking-wider rounded hover:bg-[#10B981] transition-colors cursor-pointer"
            >
              Close Radar View
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 6. CANCEL ORDER MODAL */}
      {/* ================================================================ */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-neutral-800 max-w-lg w-full p-6 sm:p-8 rounded-2xl shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setCancelModalOrder(null)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-white text-lg p-1 cursor-pointer"
            >
              ✕
            </button>

            <div>
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block">
                ORDER CANCELLATION
              </span>
              <h3 className="text-xl font-black font-brand uppercase text-white tracking-tight">
                Cancel Order #{cancelModalOrder.razorpay?.orderId || cancelModalOrder._id}
              </h3>
            </div>

            {/* Refund & Summary Card */}
            <div className="bg-rose-950/20 border border-rose-900/40 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400">Total Refund Amount:</span>
                <span className="text-base font-black text-white">
                  ₹{(cancelModalOrder.price?.amount || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <p className="text-[11px] text-rose-300 leading-relaxed">
                ✓ 100% Instant Refund will be automatically credited to your original payment method within 24-48 hours.
              </p>
            </div>

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Reason for Cancellation *
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Need different size or color">Need a different size or color</option>
                  <option value="Found better price or discount">Found better price or discount</option>
                  <option value="Delivery timeline too long">Delivery timeline is longer than expected</option>
                  <option value="Change of delivery destination">Change of delivery destination address</option>
                  <option value="Want to modify cart items">Want to modify items in the order</option>
                  <option value="Other reasons">Other reasons</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Additional Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={cancelComment}
                  onChange={(e) => setCancelComment(e.target.value)}
                  placeholder="Tell us why you decided to cancel this order..."
                  className="w-full px-3.5 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-600 outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setCancelModalOrder(null)}
                  className="flex-1 py-3 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-bold uppercase rounded-lg cursor-pointer"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={isCancelling}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-brand text-xs font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isCancelling ? "Processing..." : "Confirm Cancellation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 7. RETURN / EXCHANGE ORDER MODAL */}
      {/* ================================================================ */}
      {returnModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-neutral-800 max-w-lg w-full p-6 sm:p-8 rounded-2xl shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setReturnModalOrder(null)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-white text-lg p-1 cursor-pointer"
            >
              ✕
            </button>

            <div>
              <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest block">
                REVERSE LOGISTICS & EXCHANGE
              </span>
              <h3 className="text-xl font-black font-brand uppercase text-white tracking-tight">
                Return / Exchange Order #{returnModalOrder.razorpay?.orderId || returnModalOrder._id}
              </h3>
            </div>

            <form onSubmit={handleConfirmReturn} className="space-y-4">
              {/* Action Switch: Exchange vs Refund */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  What would you like to do? *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReturnAction("exchange")}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between space-y-1 transition-all cursor-pointer ${
                      returnAction === "exchange"
                        ? "bg-[#10B981]/15 border-[#10B981] text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        : "bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase">🔄 Exchange Size</span>
                      <span className="text-[10px] font-bold text-[#10B981]">FASTEST</span>
                    </div>
                    <span className="text-[10px] text-neutral-400">Doorstep size replacement at zero fee</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReturnAction("refund")}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between space-y-1 transition-all cursor-pointer ${
                      returnAction === "refund"
                        ? "bg-amber-500/15 border-amber-400 text-white shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                        : "bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase">💰 100% Refund</span>
                      <span className="text-[10px] font-bold text-amber-400">TO SOURCE</span>
                    </div>
                    <span className="text-[10px] text-neutral-400">Refund credited upon courier pickup</span>
                  </button>
                </div>
              </div>

              {/* If Exchange: Select New Size */}
              {returnAction === "exchange" && (
                <div className="bg-neutral-900/90 border border-neutral-800 p-4 rounded-xl space-y-2 animate-in fade-in">
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase tracking-wider">
                    Select Replacement Size *
                  </label>
                  <div className="flex gap-2">
                    {["XS", "S", "M", "L", "XL", "XXL"].map((sz) => (
                      <button
                        type="button"
                        key={sz}
                        onClick={() => setReturnExchangeSize(sz)}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase border transition-all cursor-pointer ${
                          returnExchangeSize === sz
                            ? "bg-white text-black border-white shadow-md"
                            : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reason Selector */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Reason for Return / Exchange *
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white outline-none focus:border-[#10B981] cursor-pointer"
                >
                  <option value="Size Too Small / Tight">Size Too Small / Tight</option>
                  <option value="Size Too Large / Loose">Size Too Large / Loose</option>
                  <option value="Fabric or Quality Dissatisfaction">Fabric or Quality Dissatisfaction</option>
                  <option value="Color Differs from Website">Color or Style differs from photos</option>
                  <option value="Defective or Damaged Garment">Defective or Damaged Article</option>
                  <option value="Received Wrong Item">Received Wrong Product / Size</option>
                  <option value="Other reasons">Other reasons</option>
                </select>
              </div>

              {/* Reverse Pickup Address */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Courier Reverse Pickup Address *
                </label>
                <input
                  type="text"
                  required
                  value={returnPickupAddress}
                  onChange={(e) => setReturnPickupAddress(e.target.value)}
                  placeholder="Street, Building, Landmark, City, Pincode"
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white outline-none focus:border-[#10B981]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Additional Notes for Courier / QA (Optional)
                </label>
                <textarea
                  rows={2}
                  value={returnComment}
                  onChange={(e) => setReturnComment(e.target.value)}
                  placeholder="Provide any specific instructions for the pickup agent..."
                  className="w-full px-3.5 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-600 outline-none focus:border-[#10B981]"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setReturnModalOrder(null)}
                  className="flex-1 py-3 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-bold uppercase rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReturn}
                  className="flex-1 py-3 bg-white hover:bg-[#10B981] text-black font-brand text-xs font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReturn ? "Scheduling..." : "Schedule Reverse Pickup"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
