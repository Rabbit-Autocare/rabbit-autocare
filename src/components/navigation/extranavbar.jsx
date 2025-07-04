"use client"

import { useState, useEffect, useRef } from "react"
import { Search, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { CategoryService } from "@/lib/service/microdataService"
import { useCart } from "@/hooks/useCart"
import { useAuth } from "@/hooks/useAuth"
import CouponCard from "@/components/ui/CouponCard"
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { ClientUserService } from "@/lib/service/client-userService"

const categoryImageMap = {
  "car-interior": "/assets/images/carinterior.png",
  "car-exterior": "/assets/images/banner2.png",
  "kits&combos": "/assets/images/banner.png",
  "microfiber-cloth": "/assets/images/mission.png",
}

export default function ExtraNavbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isShopOpen, setIsShopOpen] = useState(false)
  const [isCouponsOpen, setIsCouponsOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
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

  // Fetch categories using CategoryService
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true)
      try {
        // console.log("Fetching categories from CategoryService...")
        const result = await CategoryService.getCategories()
        // console.log("CategoryService result:", result)

        if (result.success && Array.isArray(result.data)) {
          const transformedCategories = result.data.map((cat) => {
            const slug = cat.name.toLowerCase().replace(/\s+/g, "-")
            const imageFromMap = categoryImageMap[slug]

            // Special handling for Kits & Combos
            if (cat.name.toLowerCase().includes("kits") && cat.name.toLowerCase().includes("combos")) {
              return {
                name: cat.name,
                href: "/shop/kits-combos",
                image: imageFromMap || cat.image || `/images/categories/${cat.id}.jpg`,
                is_microfiber: cat.is_microfiber || false,
              }
            }
            // For other categories
            return {
              name: cat.name,
              href: `/shop/${cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
              image: imageFromMap || cat.image || `/images/categories/${cat.id}.jpg`,
              is_microfiber: cat.is_microfiber || false,
            }
          })
          // console.log("Setting categories:", transformedCategories)
          setCategories(transformedCategories)
        } else {
          console.error("Failed to fetch categories:", result.error || "No data")
          setCategories([])
        }
      } catch (error) {
        console.error("Error in fetchCategories:", error)
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

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
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  return (
    <header className="w-full z-40 bg-transparent transition-all duration-300">
      <div className="flex justify-between items-center px-4 md:px-6 py-4">
        {/* Logo and SHOP button - Left side */}
        <div className="flex items-center space-x-2 md:space-x-6 relative">
          <Link href="/">
            <div className="text-2xl font-black flex items-center space-x-1">
              <img
                src="/assets/RabbitLogo.png"
                alt="Rabbit"
                className="w-[110px] h-[35px] md:w-[197px] md:h-[60px]"
              />
            </div>
          </Link>

          {/* SHOP button - Now visible on both mobile and desktop with ml-1 on mobile */}
          <div
            ref={shopButtonRef}
            className="text-sm font-semibold cursor-pointer relative ml-1 md:ml-0"
            onMouseEnter={() => handleShopHover(true)}
            onMouseLeave={() => handleShopHover(false)}
          >
            <button
              className="flex items-center gap-1 font-medium text-sm cursor-pointer"
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
              className="w-64 pl-4 pr-10 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:border-gray-500"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Coupons icon with hover */}
          <div className="relative">
            <button
              ref={couponsButtonRef}
              className="h-auto w-auto p-0 hover:bg-transparent bg-transparent border-none cursor-pointer transition-colors"
              onMouseEnter={() => setIsCouponsOpen(true)}
              onMouseLeave={() => setIsCouponsOpen(false)}
            >
              <svg viewBox="0 0 25 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[20px] h-[20px] md:w-[20px] md:h-[20px]">
                <path
                  d="M2.08301 9.87498C2.91181 9.87498 3.70667 10.2042 4.29272 10.7903C4.87877 11.3763 5.20801 12.1712 5.20801 13C5.20801 13.8288 4.87877 14.6236 4.29272 15.2097C3.70667 15.7957 2.91181 16.125 2.08301 16.125V18.2083C2.08301 18.7608 2.3025 19.2908 2.6932 19.6815C3.0839 20.0722 3.61381 20.2916 4.16634 20.2916H20.833C21.3855 20.2916 21.9154 20.0722 22.3061 19.6815C22.6968 19.2908 22.9163 18.7608 22.9163 18.2083V16.125C22.0875 16.125 21.2927 15.7957 20.7066 15.2097C20.1206 14.6236 19.7913 13.8288 19.7913 13C19.7913 12.1712 20.1206 11.3763 20.7066 10.7903C21.2927 10.2042 22.0875 9.87498 22.9163 9.87498V7.79165C22.9163 7.23911 22.6968 6.70921 22.3061 6.31851C21.9154 5.92781 21.3855 5.70831 20.833 5.70831H4.16634C3.61381 5.70831 3.0839 5.92781 2.6932 6.31851C2.3025 6.70921 2.08301 7.23911 2.08301 7.79165V9.87498Z"
                  stroke="black"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9.375 9.875H9.38542"
                  stroke="black"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15.625 9.875L9.375 16.125"
                  stroke="black"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15.625 16.125H15.6354"
                  stroke="black"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="sr-only">Coupons</span>
            </button>
          </div>

          {/* Wishlist icon - Hidden on mobile, visible on desktop */}
          <button className="hidden md:block h-auto w-auto p-0 hover:bg-transparent bg-transparent border-none cursor-pointer transition-colors">
            <Link
              href="/wishlist"
              className="hidden md:block h-auto w-auto p-0 hover:bg-transparent bg-transparent border-none cursor-pointer transition-colors"
              aria-label="Go to Shine List"
            >
              <div className="relative w-5 h-5">
                <Image src="/assets/shine.svg" alt="shine list" fill className="object-contain" />
              </div>
              <span className="sr-only">Shine List</span>
            </Link>
          </button>

          {/* User Icon and Cart */}
          <div className="flex items-center space-x-6 md:space-x-6">
            {isLoggedIn ? (
              <Link href="/profile">
                <button className="h-auto w-auto p-0 hover:bg-transparent bg-transparent border-none cursor-pointer transition-colors">
                  <User className="w-[20px] h-[20px] md:w-5 md:h-5" />
                  <span className="sr-only">User Profile</span>
                </button>
              </Link> 
            ) : (
              <Link href="/login">
                <button className="h-auto w-auto p-0 hover:bg-transparent bg-transparent border-none cursor-pointer transition-colors">
                  <User className="w-[20px] h-[20px] md:w-5 md:h-5" />
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
                className="w-[18px] h-[18px] md:w-5 md:h-5"
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
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 aspect-[3/2] rounded-lg"></div>
                  <div className="h-6 md:h-8 bg-gray-200 mt-2 rounded"></div>
                </div>
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              {categories.map((category, index) => (
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
          ) : (
            <div className="text-center py-6 md:py-8">
              <p className="text-gray-500 text-sm md:text-base">No categories available</p>
            </div>
          )}
        </div>
      </div>

      {/* Coupons dropdown - FIXED STYLING */}
      <div
        className={`absolute right-6 top-full bg-white shadow-lg z-30 border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 ease-in-out w-80 ${
          isCouponsOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}
        onMouseEnter={() => setIsCouponsOpen(true)}
        onMouseLeave={() => setIsCouponsOpen(false)}
      >
        <div className="p-2">
          {/* <h3 className="font-semibold text-lg mb-4 text-gray-800">Your Available Coupons</h3> */}
          <div className="coupon-scroll-area" style={{ maxHeight: 320, overflowY: 'auto' }}>
            {authLoading ? (
              <div className="text-center p-4">
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : user ? (
              (userCoupons.length > 0 || availableCoupons.length > 0) ? (
                <div className="space-y-3">
                  {userCoupons.length > 0 && (
                    <>
                      <h4 className="font-semibold text-sm text-gray-600 px-2 pt-2">Your Coupons</h4>
                      {userCoupons.map((coupon) => (
                        <CouponCard
                          key={`user-${coupon.id}`}
                          code={coupon.code}
                          discount={coupon.discount}
                          validUpto={coupon.validUpto}
                        />
                      ))}
                    </>
                  )}
                  {availableCoupons.length > 0 && (
                    <>
                      <h4 className="font-semibold text-sm text-gray-600 px-2 pt-4">Available Coupons</h4>
                      {availableCoupons.map((coupon) => (
                        <CouponCard
                          key={`avail-${coupon.id}`}
                          code={coupon.code}
                          discount={coupon.discount}
                          validUpto={coupon.validUpto}
                        />
                      ))}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="mx-auto mb-3 w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No coupons available</p>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto mb-3 w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-gray-500 mb-3">Please log in to view your coupons</p>
                <Link href="/login" className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
