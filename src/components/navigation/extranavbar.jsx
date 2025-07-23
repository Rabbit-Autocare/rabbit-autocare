"use client"

import { useState, useEffect, useRef } from "react"
import { Search, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useCart } from "@/hooks/useCart"
import { useAuth } from "@/hooks/useAuth"
import CouponCard from "@/components/ui/CouponCard"
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { ClientUserService } from "@/lib/service/client-userService"
import { SEARCH_MAP } from "@/utils/searchKeywords";

const categoryImageMap = {
  "car-interior": "/assets/images/banner.png",
  "car-exterior": "/assets/images/banner3.png",
  "kits&combos": "/assets/images/kitcombobanner.png",
  "microfiber-cloth": "/assets/images/microfiber.png",
}

const STATIC_CATEGORIES = [
  { name: "Car Interior", href: "/shop/car-interior", image: "/assets/images/banner.png" },
  { name: "Car Exterior", href: "/shop/car-exterior", image: "/assets/images/banner3.png" },
  { name: "Microfiber Cloth", href: "/shop/microfiber-cloth", image: "/assets/images/microfiber.png" },
  { name: "Kits & Combos", href: "/shop/kits-combos", image: "/assets/images/kitcombobanner.png" },
];

function MobileCouponDropdown({ availableCoupons, authLoading, user, isCouponsOpen, setIsCouponsOpen, isHomePage }) {
  const textColor = isHomePage ? "text-white" : "text-gray-500";
  const bgColor = isHomePage ? "bg-white/10 backdrop-blur-sm" : "bg-white";
  const borderColor = isHomePage ? "border-white/20" : "border-gray-200";

  if (!isCouponsOpen) return null;
  return (
    <div className="fixed z-50 px-4 py-4 w-full">
      <div className="coupon-scroll-area max-h-80 overflow-y-auto">
        {authLoading ? (
          <div className="text-center">
            <p className={textColor}>Loading...</p>
          </div>
        ) : user ? (
          availableCoupons && availableCoupons.length > 0 ? (
            <div className="space-y-3 mb-3">
              {availableCoupons.map((coupon) => (
                <CouponCard
                  key={coupon.id}
                  code={coupon.code}
                  discount={coupon.discount}
                  validUpto={coupon.validUpto}
                />
              ))}
            </div>
          ) : (
            <div className={`text-center py-8 ${textColor}`}>
              <svg
                className={`mx-auto mb-3 w-12 h-12 ${isHomePage ? 'text-white/50' : 'text-gray-300'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>No coupons available</p>
            </div>
          )
        ) : (
          <div className="text-center py-8">
            <svg
              className={`mx-auto mb-3 w-12 h-12 ${isHomePage ? 'text-white/50' : 'text-gray-300'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <p className={`${textColor} mb-3`}>Please log in to view your coupons</p>
            <Link href="/login" className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
              Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExtraNavbar() {
  const pathname = usePathname()
  const isHomePage = pathname === "/" || pathname === "/home"

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isShopOpen, setIsShopOpen] = useState(false)
  const [isCouponsOpen, setIsCouponsOpen] = useState(false)
  const [showMobileCoupons, setShowMobileCoupons] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [userCoupons, setUserCoupons] = useState([])
  const [availableCoupons, setAvailableCoupons] = useState([])
  const { openCart, cartCount } = useCart()
  const { user, loading: authLoading } = useAuth()

  // Refs for click outside detection
  const shopDropdownRef = useRef(null)
  const shopButtonRef = useRef(null)
  const couponsDropdownRef = useRef(null)
  const couponsButtonRef = useRef(null)

  // State to track if we're on mobile
  const [isMobile, setIsMobile] = useState(false)

  // Dynamic colors based on homepage
  const textColor = isHomePage ? "text-white" : "text-black"
  const iconStroke = isHomePage ? "white" : "black"
  const placeholderColor = isHomePage ? "placeholder-white/70" : "placeholder-gray-500"
  const inputBorder = isHomePage ? "border-white/30" : "border-gray-300"
  const inputFocus = isHomePage ? "focus:border-white/50" : "focus:border-gray-500"
  const dropdownBg = isHomePage ? "bg-white/10 backdrop-blur-sm" : "bg-white"
  const dropdownBorder = isHomePage ? "border-white/20" : "border-gray-200"
  const dropdownText = isHomePage ? "text-white" : "text-gray-500"

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }

    // Initial check
    checkIsMobile()

    // Listen for resize
    window.addEventListener("resize", checkIsMobile)

    // Cleanup
    return () => window.removeEventListener("resize", checkIsMobile)
  }, [])

  // Check login status on mount and when localStorage changes
  useEffect(() => {
    const checkLoginStatus = () => {
      const loggedIn = localStorage.getItem("isLoggedIn") === "true"
      setIsLoggedIn(loggedIn)
    }

    // Initial check
    checkLoginStatus()

    // Listen for storage changes
    window.addEventListener("storage", checkLoginStatus)

    // Cleanup
    return () => window.removeEventListener("storage", checkLoginStatus)
  }, [])

  // Handle click outside for shop dropdown (mobile only)
  useEffect(() => {
    if (!isMobile) return // Only apply on mobile

    const handleClickOutside = (event) => {
      if (
        isShopOpen &&
        shopDropdownRef.current &&
        shopButtonRef.current &&
        !shopDropdownRef.current.contains(event.target) &&
        !shopButtonRef.current.contains(event.target)
      ) {
        setIsShopOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [isShopOpen, isMobile])

  // Handle shop button click (mobile only)
  const handleShopClick = () => {
    if (isMobile) {
      setIsShopOpen(!isShopOpen)
    }
  }

  // Handle shop hover (desktop only)
  const handleShopHover = (isHovering) => {
    if (!isMobile) {
      setIsShopOpen(isHovering)
    }
  }

  // Fetch user's coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      console.log('ExtraNavbar - Fetching coupons for user:', user?.id);
      if (user?.id) {
        const { success, data, error } = await ClientUserService.getUserCoupons(user.id);
        console.log('ExtraNavbar - Fetch result:', { success, data, error });
        if (success) {
          setUserCoupons(data.userCoupons || []);
          setAvailableCoupons(data.availableCoupons || []);
          console.log('ExtraNavbar - Updated state:', {
            userCoupons: data.userCoupons,
            availableCoupons: data.availableCoupons
          });
        } else {
          console.error('ExtraNavbar - Failed to fetch coupons:', error);
        }
      }
    };

    if (!authLoading) {
      fetchCoupons();
    }
  }, [user?.id, authLoading]);

  // Add a debug log when state changes
  useEffect(() => {
    console.log('ExtraNavbar - Current coupon state:', {
      userCoupons,
      availableCoupons,
      isCouponsOpen,
      authLoading,
      user: !!user
    });
  }, [userCoupons, availableCoupons, isCouponsOpen, authLoading, user]);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    const match = SEARCH_MAP.find(item =>
      item.keywords.some(keyword => query.includes(keyword))
    );
    if (match) {
      window.location.href = match.route;
    } else {
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-40 bg-transparent transition-all duration-300">
      <div className="flex justify-between items-center px-4 md:px-6 py-4">
        {/* Logo and SHOP button - Left side */}
        <div className="flex items-center space-x-2 md:space-x-6 relative">
          <Link href="/">
            <div className="text-2xl font-black flex items-center space-x-1">
              <img
                src={isHomePage ? "/assets/RabbitLogo.png" : "/assets/RabbitLogo.png"}
                alt="Rabbit"
                className="w-[110px] h-[35px] md:w-[197px] md:h-[60px]"
              />
            </div>
          </Link>

          {/* SHOP button - Now visible on both mobile and desktop with ml-1 on mobile */}
          <div
            ref={shopButtonRef}
            className={`text-sm font-semibold cursor-pointer relative ml-1 md:ml-0 ${textColor}`}
            onMouseEnter={() => handleShopHover(true)}
            onMouseLeave={() => handleShopHover(false)}
          >
            <button
              className={`flex items-center gap-1 font-medium text-sm cursor-pointer ${textColor}`}
              onClick={handleShopClick}
            >
              SHOP
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 ease-in-out ml-1 ${isShopOpen ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right side: Search (desktop only), Coupons, Wishlist (desktop only), User Icon/Login, Cart */}
        <div className="flex items-center space-x-6 md:space-x-6">
          {/* Search form - Hidden on mobile, visible on desktop */}
          <form onSubmit={handleSearch} className="relative hidden md:block">
            <input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-64 pl-4 pr-10 py-2 text-sm border rounded-full focus:outline-none ${inputBorder} ${inputFocus} ${placeholderColor} ${isHomePage ? 'bg-white/10 backdrop-blur-sm text-white' : 'bg-white text-black'}`}
            />
            <button
              type="submit"
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${isHomePage ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Coupons icon with hover - Fixed positioning */}
          <div
            className="relative"
            onMouseEnter={() => !isMobile && setIsCouponsOpen(true)}
            onMouseLeave={() => !isMobile && setIsCouponsOpen(false)}
          >
            <button
              ref={couponsButtonRef}
              className="h-auto w-auto p-0 hover:bg-transparent bg-transparent border-none cursor-pointer transition-colors"
              onClick={() => isMobile ? setShowMobileCoupons((v) => !v) : undefined}
              aria-label="Coupons"
            >
              <svg viewBox="0 0 25 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[20px] h-[20px] md:w-[20px] md:h-[20px]">
                <path
                  d="M2.08301 9.87498C2.91181 9.87498 3.70667 10.2042 4.29272 10.7903C4.87877 11.3763 5.20801 12.1712 5.20801 13C5.20801 13.8288 4.87877 14.6236 4.29272 15.2097C3.70667 15.7957 2.91181 16.125 2.08301 16.125V18.2083C2.08301 18.7608 2.3025 19.2908 2.6932 19.6815C3.0839 20.0722 3.61381 20.2916 4.16634 20.2916H20.833C21.3855 20.2916 21.9154 20.0722 22.3061 19.6815C22.6968 19.2908 22.9163 18.7608 22.9163 18.2083V16.125C22.0875 16.125 21.2927 15.7957 20.7066 15.2097C20.1206 14.6236 19.7913 13.8288 19.7913 13C19.7913 12.1712 20.1206 11.3763 20.7066 10.7903C21.2927 10.2042 22.0875 9.87498 22.9163 9.87498V7.79165C22.9163 7.23911 22.6968 6.70921 22.3061 6.31851C21.9154 5.92781 21.3855 5.70831 20.833 5.70831H4.16634C3.61381 5.70831 3.0839 5.92781 2.6932 6.31851C2.3025 6.70921 2.08301 7.23911 2.08301 7.79165V9.87498Z"
                  stroke={iconStroke}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9.375 9.875H9.38542"
                  stroke={iconStroke}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15.625 9.875L9.375 16.125"
                  stroke={iconStroke}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15.625 16.125H15.6354"
                  stroke={iconStroke}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="sr-only">Coupons</span>
            </button>
            {/* Coupons dropdown - Desktop style with fixed positioning */}
            {isCouponsOpen && !isMobile && (
              <div className={`absolute right-0 top-full mt-1 shadow-lg z-30 border rounded-lg overflow-hidden w-80 ${dropdownBg} ${dropdownBorder}`}>
                <div className="p-2">
                  <div className="coupon-scroll-area max-h-80 overflow-y-auto" style={{ overscrollBehavior: 'contain', touchAction: 'auto' }}>
                    {authLoading ? (
                      <div className="text-center p-4">
                        <p className={dropdownText}>Loading...</p>
                      </div>
                    ) : user ? (
                      availableCoupons.length > 0 ? (
                        <div className="space-y-3">
                          <h4 className={`font-semibold text-sm px-2 pt-2 ${isHomePage ? 'text-white/80' : 'text-gray-600'}`}>Available Coupons</h4>
                          {availableCoupons.map((coupon) => (
                            <CouponCard
                              key={`avail-${coupon.id}`}
                              code={coupon.code}
                              discount={coupon.discount}
                              validUpto={coupon.validUpto}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className={`text-center py-8 ${dropdownText}`}>
                          <svg className={`mx-auto mb-3 w-12 h-12 ${isHomePage ? 'text-white/50' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p>No coupons available</p>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-8">
                        <svg className={`mx-auto mb-3 w-12 h-12 ${isHomePage ? 'text-white/50' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <p className={`${dropdownText} mb-3`}>Please log in to view your coupons</p>
                        <Link href="/login" className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                          Login
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Wishlist icon - Hidden on mobile, visible on desktop */}
          <button className="hidden md:block h-auto w-auto p-0 hover:bg-transparent bg-transparent border-none cursor-pointer transition-colors">
            <Link
              href="/wishlist"
              className="hidden md:block h-auto w-auto p-0 hover:bg-transparent bg-transparent border-none cursor-pointer transition-colors"
              aria-label="Go to Shine List"
            >
              <div className="relative w-5 h-5">
                <Image
                  src={isHomePage ? "/assets/star-filled-white.svg" : "/assets/shine.svg"}
                  alt="shine list"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="sr-only">Shine List</span>
            </Link>
          </button>

          {/* User Icon and Cart */}
          <div className="flex items-center space-x-6 md:space-x-6">
            {isLoggedIn ? (
              <Link href="/profile">
                <button className="h-auto w-auto p-0 hover:bg-transparent bg-transparent border-none cursor-pointer transition-colors">
                  <User className={`w-[20px] h-[20px] md:w-5 md:h-5 ${textColor}`} />
                  <span className="sr-only">User Profile</span>
                </button>
              </Link>
            ) : (
              <Link href="/login">
                <button className="h-auto w-auto p-0 hover:bg-transparent bg-transparent border-none cursor-pointer transition-colors">
                  <User className={`w-[20px] h-[20px] md:w-5 md:h-5 ${textColor}`} />
                  <span className="sr-only">User account</span>
                </button>
              </Link>
            )}

            {/* Cart Icon - Always visible */}
            <button
              onClick={openCart}
              className="relative h-auto w-auto p-0 hover:bg-transparent bg-transparent border-none cursor-pointer transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-[18px] h-[18px] md:w-5 md:h-5 ${textColor}`}
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center text-[10px] md:text-xs">
                  {cartCount}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </button>
          </div>
        </div>
      </div>

      {/* SHOP Dropdown with lower z-index */}
      <div
        ref={shopDropdownRef}
        className={`absolute left-0 right-0 bg-white shadow-lg border-b border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${
          isShopOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{ zIndex: 50 }} // Much lower than cart
        onMouseEnter={() => handleShopHover(true)}
        onMouseLeave={() => handleShopHover(false)}
      >
        <div className="container mx-auto py-4 md:py-8 px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {STATIC_CATEGORIES.map((category, index) => (
              <Link key={index} href={category.href} className="block group" onClick={() => setIsShopOpen(false)}>
                <div className="overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="relative aspect-[3/2] bg-gray-100">
                    <img
                      src={category.image || "/placeholder.svg"}
                      alt={category.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="bg-black text-white py-2 md:py-3 px-2 md:px-4 text-center">
                    <span className="font-medium text-xs md:text-sm">{category.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      {isMobile && (
        <MobileCouponDropdown
          availableCoupons={availableCoupons}
          authLoading={authLoading}
          user={user}
          isCouponsOpen={showMobileCoupons}
          setIsCouponsOpen={setShowMobileCoupons}
          isHomePage={isHomePage}
        />
      )}
    </header>
  )
}
