import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router";
import { setUser } from "../../auth/state/auth.slice";
import { useWishlist } from "../../products/hooks/useWishlist";

export default function Nav({
  searchQuery: propSearchQuery,
  onSearchChange,
  activeCategory: propActiveCategory,
  onCategorySelect,
  wishlistCount: propWishlistCount,
  cartCount: propCartCount,
}) {
  const user = useSelector((state) => state.auth?.user);
  const reduxCartItems = useSelector((state) => state.cart?.items || []);
  const { wishlistCount } = useWishlist();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [showUserMenu, setShowUserMenu] = useState(false);

  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Search query sync with URL if on home or local input
  const urlSearch = searchParams.get("search") || "";
  const [localSearch, setLocalSearch] = useState(propSearchQuery ?? urlSearch);

  useEffect(() => {
    if (propSearchQuery !== undefined) {
      setLocalSearch(propSearchQuery);
    } else {
      setLocalSearch(urlSearch);
    }
  }, [propSearchQuery, urlSearch]);

  const totalWishlistCount = propWishlistCount !== undefined ? propWishlistCount : wishlistCount;

  const totalCartCount =
    propCartCount !== undefined
      ? propCartCount
      : reduxCartItems.reduce(
          (sum, item) => sum + (Number(item?.quantity) || 1),
          0
        );

  const handleSearchChange = (value) => {
    setLocalSearch(value);
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      const q = value.trim();
      if (location.pathname === "/") {
        const newParams = new URLSearchParams(searchParams);
        if (q) {
          newParams.set("search", q);
        } else {
          newParams.delete("search");
        }
        setSearchParams(newParams, { replace: true });
      }
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = localSearch.trim();
    if (location.pathname !== "/") {
      navigate(query ? `/?search=${encodeURIComponent(query)}` : "/");
    } else {
      const newParams = new URLSearchParams(searchParams);
      if (query) {
        newParams.set("search", query);
      } else {
        newParams.delete("search");
      }
      setSearchParams(newParams);
    }
    setShowMobileSearch(false);
  };

  const handleLogout = () => {
    dispatch(setUser(null));
    setShowUserMenu(false);
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-black/95 backdrop-blur-md border-b border-neutral-800 text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-1.5 group select-none flex-shrink-0">
          <span className="font-brand text-lg sm:text-2xl font-black tracking-widest text-white group-hover:text-neutral-300 transition-colors">
            SNITCH
          </span>
        </Link>

        {/* Desktop Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              placeholder="Search shirts, tees, cargos, jackets..."
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-md outline-none bg-neutral-900 text-white placeholder:text-neutral-500 border border-neutral-800 focus:border-white transition-all font-space"
            />
            <button
              type="submit"
              className="absolute left-3 text-neutral-400 hover:text-white cursor-pointer"
              title="Search"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>
            {localSearch && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 text-xs text-neutral-400 hover:text-white cursor-pointer"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </form>
        </div>

        {/* Navigation Links & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-4 md:gap-6 text-xs font-semibold">
          {/* Mobile Search Icon Toggle */}
          <button
            type="button"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden text-neutral-300 hover:text-white p-1.5 rounded-lg hover:bg-neutral-900 cursor-pointer"
            title="Toggle Search"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </button>

          <Link
            to="/"
            className="text-neutral-300 hover:text-white transition-colors hidden xs:inline-block px-1.5 py-1"
          >
            Shop
          </Link>

          <Link
            to="/seller/dashboard"
            className="text-neutral-400 hover:text-white transition-colors hidden lg:inline-block"
          >
            Seller Hub
          </Link>

          {/* Ultra-Premium Circular Profile in Nav Bar */}
          {user ? (
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="group relative p-0.5 rounded-full transition-all duration-300 cursor-pointer select-none focus:outline-none"
                title={`${user.fullname || "Profile"} • Account Hub`}
              >
                {/* Multi-layered Glowing Circular Profile Frame */}
                <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#10B981] via-amber-400 to-[#38BDF8] group-hover:scale-105 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_22px_rgba(16,185,129,0.6)]">
                  {/* Subtle Inner Glow Ring */}
                  <div className="w-full h-full rounded-full bg-[#0a0a0a] p-[1.5px] flex items-center justify-center overflow-hidden">
                    {user.profilepic ? (
                      <img
                        src={user.profilepic}
                        alt={user.fullname || "Profile"}
                        className="w-full h-full rounded-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-b from-neutral-800 to-neutral-950 flex items-center justify-center text-white font-brand font-black text-xs sm:text-sm tracking-wider shadow-inner group-hover:text-[#10B981] transition-colors">
                        {(user.fullname || "U").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Online Glowing Presence Dot */}
                <span className="absolute bottom-0 right-0 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10B981] border-2 border-black" />
                </span>
              </button>

              {/* Enhanced Circular Profile Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2.5 w-72 bg-[#111111]/95 backdrop-blur-xl text-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-neutral-800/90 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 divide-y divide-neutral-800/80">
                    {/* Header in Dropdown with Circular Avatar */}
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="px-4 py-3 flex items-center gap-3.5 hover:bg-neutral-900/80 transition-all rounded-xl mx-1.5"
                    >
                      <div className="relative w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-[#10B981] via-amber-400 to-[#38BDF8] shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                        <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
                          {user.profilepic ? (
                            <img
                              src={user.profilepic}
                              alt={user.fullname}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-black font-brand text-white">
                              {(user.fullname || "U").slice(0, 1).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="overflow-hidden flex-1">
                        <p className="text-xs font-black text-white truncate tracking-tight uppercase">{user.fullname}</p>
                        <p className="text-[10px] text-neutral-400 truncate">{user.email}</p>
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-[#10B981]/15 text-[#10B981] text-[9px] font-black uppercase tracking-wider rounded-full border border-[#10B981]/30">
                          <span className="w-1 h-1 rounded-full bg-[#10B981]" />
                          {user.role === "seller" ? "Verified Seller" : "VIP Member"}
                        </span>
                      </div>
                    </Link>

                    {/* Navigation Options */}
                    <div className="py-1.5 px-1.5 space-y-0.5">
                      <Link
                        to="/profile?tab=orders"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-3.5 py-2.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800/80 rounded-lg transition-colors font-semibold"
                      >
                        <span className="text-base">📦</span>
                        <span>My Orders & Drops</span>
                      </Link>

                      <Link
                        to="/profile?tab=wishlist"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-3.5 py-2.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800/80 rounded-lg transition-colors font-semibold"
                      >
                        <span className="text-base">❤️</span>
                        <span>Saved Wishlist</span>
                      </Link>

                      <Link
                        to="/profile?tab=addresses"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-3.5 py-2.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800/80 rounded-lg transition-colors font-semibold"
                      >
                        <span className="text-base">📍</span>
                        <span>Delivery Addresses</span>
                      </Link>

                      <Link
                        to="/profile?tab=settings"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-3.5 py-2.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800/80 rounded-lg transition-colors font-semibold"
                      >
                        <span className="text-base">⚙️</span>
                        <span>Account Settings</span>
                      </Link>
                    </div>

                    {/* Seller Link if Seller */}
                    {user.role === "seller" && (
                      <div className="py-1.5 px-1.5">
                        <Link
                          to="/seller/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-3.5 py-2 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 rounded-lg transition-colors font-bold"
                        >
                          <span className="text-base">🏪</span>
                          <span>Seller Dashboard</span>
                        </Link>
                      </div>
                    )}

                    {/* Logout Option */}
                    <div className="pt-1.5 px-1.5">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 text-left px-3.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg font-bold cursor-pointer transition-colors"
                      >
                        <span className="text-base">🚪</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-neutral-700/80 bg-neutral-900/90 hover:border-[#10B981] hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] text-neutral-300 hover:text-white flex items-center justify-center transition-all duration-300 group cursor-pointer"
              title="Sign In / Join"
            >
              <svg className="w-4 h-4 group-hover:scale-110 group-hover:text-[#10B981] transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          )}

          {/* Wishlist Link */}
          <Link
            to="/wishlist"
            className="hover-heart-beat group/navwish flex items-center gap-1 text-neutral-300 hover:text-white transition-all cursor-pointer relative py-1 px-1.5 sm:px-2 rounded-lg hover:bg-neutral-900"
            title="View Wishlist"
          >
            <svg
              className={`w-4 h-4 transition-all duration-300 ${
                totalWishlistCount > 0
                  ? "text-rose-500 fill-rose-500 scale-110"
                  : "text-neutral-300 fill-none group-hover/navwish:text-rose-500 group-hover/navwish:scale-125"
              }`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
            <span className="hidden sm:inline text-xs font-semibold group-hover/navwish:text-white">Wishlist</span>
            {totalWishlistCount > 0 && (
              <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full min-w-4 text-center animate-heart-pop shadow-[0_0_8px_rgba(225,29,72,0.8)]">
                {totalWishlistCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link
            to="/cart"
            className="flex items-center gap-1 sm:gap-1.5 bg-white text-black px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-bold hover:bg-neutral-200 transition-colors shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span className="hidden xs:inline">Cart</span>
            <span className="bg-black text-white text-[9px] sm:text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-4 text-center">
              {totalCartCount}
            </span>
          </Link>
        </div>
      </div>

      {/* Mobile Search Bar Drawer */}
      {showMobileSearch && (
        <div className="sm:hidden px-4 pb-3 pt-1 border-t border-neutral-800 bg-neutral-950 animate-in slide-in-from-top-2 duration-150">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              placeholder="Search shirts, tees, cargos, jackets..."
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-8 py-2 text-xs rounded-md outline-none bg-neutral-900 text-white placeholder:text-neutral-500 border border-neutral-700 focus:border-white transition-all font-space"
            />
            <button
              type="submit"
              className="absolute left-3 text-neutral-400 hover:text-white"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>
            {localSearch && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 text-xs text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </form>
        </div>
      )}
    </header>
  );
}
