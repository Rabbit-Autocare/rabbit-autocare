"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "@/contexts/ThemeContext"
import { useCart } from "@/hooks/useCart"
import { Menu, X } from "lucide-react"
import { CategoryService } from "@/lib/service/microdataService"
import { useAuth } from "@/hooks/useAuth"
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import CouponCard from "@/components/ui/CouponCard"

const categoryImageMap = {
  "car-interior": "/assets/images/carinterior.png",
  "car-exterior": "/assets/images/banner2.png",
  "kits&combos": "/assets/images/banner.png",
  "microfiber-cloth": "/assets/images/mission.png",
}

const navLinks = [
  { name: "HOME", href: "/" },
  { name: "ABOUT US", href: "/about" },
  { name: "PRODUCTS", href: "/products" },
  { name: "BLOGS", href: "/blog" },
  { name: "GET IN TOUCH", href: "/contact" },
]

const coupons = [
  { code: "SAVE20", description: "20% off on all products", discount: "20% OFF" },
  { code: "FIRST10", description: "10% off for first-time buyers", discount: "10% OFF" },
]

export default function MobileNavbar({ isMobileMenuOpen, setIsMobileMenuOpen }) {
  const [showCoupons, setShowCoupons] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { openCart, cartCount } = useCart()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [userCoupons, setUserCoupons] = useState([])
  const { user, loading: authLoading } = useAuth()
  const [isReady, setIsReady] = useState(false)

  // Handle initialization
  useEffect(() => {
    setIsReady(true);
    return () => setIsReady(false);
  }, []);

  // Handle scroll locking with initialization check
  useEffect(() => {
    if (!isReady) return;

    let scrollY = 0;

    if (isMobileMenuOpen) {
      // Store current scroll position and lock body
      scrollY = window.scrollY;
      document.body.style.top = `-${scrollY}px`;
      document.body.classList.add('mobile-menu-open');

      // Pause ScrollSmoother if it exists
      if (typeof window !== 'undefined' && window.scrollSmoother) {
        window.scrollSmoother.paused(true);
      }
    } else {
      // Remove lock and restore scroll position
      document.body.classList.remove('mobile-menu-open');
      document.body.style.top = '';
      window.scrollTo(0, scrollY);

      // Resume ScrollSmoother if it exists
      if (typeof window !== 'undefined' && window.scrollSmoother) {
        const timer = setTimeout(() => {
          window.scrollSmoother.paused(false);
        }, 100);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      // Cleanup on unmount
      document.body.classList.remove('mobile-menu-open');
      document.body.style.top = '';
      if (typeof window !== 'undefined' && window.scrollSmoother) {
        window.scrollSmoother.paused(false);
      }
    };
  }, [isMobileMenuOpen, isReady]);

  useEffect(() => {
    const checkLoginStatus = () => {
      const loggedIn = localStorage.getItem("isLoggedIn") === "true"
      setIsLoggedIn(loggedIn)
    }

    checkLoginStatus()
    window.addEventListener("storage", checkLoginStatus)
    return () => window.removeEventListener("storage", checkLoginStatus)
  }, [])

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true)
      try {
        const result = await CategoryService.getCategories()
        if (result.success && Array.isArray(result.data)) {
          const transformedCategories = result.data.map((cat) => ({
            name: cat.name,
            href: `/shop/${cat.name.toLowerCase().replace(/\s+/g, "-")}`,
            image: cat.image || `/images/categories/${cat.id}.jpg`,
            is_microfiber: cat.is_microfiber || false,
          }))
          setCategories(transformedCategories)
        } else {
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
    const fetchUserCoupons = async () => {
      if (user?.id) {
        const supabase = createSupabaseBrowserClient();
        const { data: userCoupons, error } = await supabase
          .from('user_coupons')
          .select('*, coupons (*)')
          .eq('user_id', user.id);
        if (!error) setUserCoupons(userCoupons || []);
      }
    };

    if (!authLoading) {
      fetchUserCoupons();
    }
  }, [user?.id, authLoading]);

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const closeMobileMenu = () => {
    if (!isReady) return;
    setIsMobileMenuOpen(false)
    setShowCoupons(false)
  }

  const toggleMobileMenu = () => {
    if (!isReady) return;
    setIsMobileMenuOpen(!isMobileMenuOpen)
    if (showCoupons) {
      setShowCoupons(false)
    }
  }

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="bg-white border-b border-gray-200 py-3 px-4 relative z-[100000]">
        <div className="flex justify-between items-center">
          {/* Hamburger Menu */}
          <button
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X size={24} className="text-gray-600" strokeWidth={1.5} />
            ) : (
              <Menu size={24} className="text-gray-600" strokeWidth={1.5} />
            )}
          </button>

          {/* Logo */}
          <Link href="/" className="flex-1 flex justify-center">
            <Image src="/assets/RabbitLogo.png" alt="Rabbit Autocare" width={120} height={40} className="h-8 w-auto" />
          </Link>

          {/* Icons */}
          <div className="flex items-center space-x-3">
            {/* User Icon */}
            {isLoggedIn ? (
              <Link href="/profile">
                <button className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                  <Image src="/assets/account.svg" alt="user" width={18} height={18} />
                  <span className="sr-only">User Profile</span>
                </button>
              </Link>
            ) : (
              <Link href="/login">
                <button className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                  <Image src="/assets/account.svg" alt="user" width={18} height={18} />
                  <span className="sr-only">User account</span>
                </button>
              </Link>
            )}

            {/* Coupons Icon */}
            <button
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              onClick={() => setShowCoupons(!showCoupons)}
              aria-label="Toggle coupons"
            >
              <svg width="18" height="18" viewBox="0 0 25 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M2.08301 9.87498C2.91181 9.87498 3.70667 10.2042 4.29272 10.7903C4.87877 11.3763 5.20801 12.1712 5.20801 13C5.20801 13.8288 4.87877 14.6236 4.29272 15.2097C3.70667 15.7957 2.91181 16.125 2.08301 16.125V18.2083C2.08301 18.7608 2.3025 19.2908 2.6932 19.6815C3.0839 20.0722 3.61381 20.2916 4.16634 20.2916H20.833C21.3855 20.2916 21.9154 20.0722 22.3061 19.6815C22.6968 19.2908 22.9163 18.7608 22.9163 18.2083V16.125C22.0875 16.125 21.2927 15.7957 20.7066 15.2097C20.1206 14.6236 19.7913 13.8288 19.7913 13C19.7913 12.1712 20.1206 11.3763 20.7066 10.7903C21.2927 10.2042 22.0875 9.87498 22.9163 9.87498V7.79165C22.9163 7.23911 22.6968 6.70921 22.3061 6.31851C21.9154 5.92781 21.3855 5.70831 20.833 5.70831H4.16634C3.61381 5.70831 3.0839 5.92781 2.6932 6.31851C2.3025 6.70921 2.08301 7.23911 2.08301 7.79165V9.87498Z"
                  stroke="#6B7280"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9.375 9.875H9.38542"
                  stroke="#6B7280"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15.625 9.875L9.375 16.125"
                  stroke="#6B7280"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15.625 16.125H15.6354"
                  stroke="#6B7280"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="sr-only">Coupons</span>
            </button>

            {/* Wishlist Icon */}
            <Link href="/wishlist">
              <button className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                <div className="relative w-[18px] h-[18px]">
                  <Image src="/assets/shine.svg" alt="shine list" fill className="object-contain" />
                </div>
                <span className="sr-only">Shine List</span>
              </button>
            </Link>

            {/* Cart Icon */}
            <button onClick={openCart} className="relative p-1 hover:bg-gray-100 rounded-md transition-colors">
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
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 py-3 px-4 relative z-50">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="search"
            placeholder="Search for microfiber clothes or any other product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-12 py-2.5 text-sm border-b border-gray-300 focus:outline-none focus:border-gray-500 bg-transparent"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-500"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="sr-only">Search</span>
          </button>
        </form>
      </div>

      {/* Coupons Dropdown */}
      {showCoupons && (
        <div className="bg-white border-b border-gray-200 shadow-lg relative z-40">
          <div className="px-4 py-4">
            {/* <h3 className="font-semibold text-lg mb-3">Available Coupons</h3> */}
            <div className="coupon-scroll-area">
              {authLoading ? (
                <div className="text-center ">
                  <p className="text-gray-500">Loading...</p>
                </div>
              ) : user ? (
                userCoupons.length > 0 ? (
                  <div className="space-y-3 mb-3">
                    {userCoupons.map((coupon) => (
                      <CouponCard
                        key={coupon.id}
                        code={coupon.code}
                        discount={coupon.discount}
                        validUpto={coupon.expiry}
                      />
                    ))}
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
      )}

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100001] flex flex-col">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <div
            className={`relative w-full bg-white shadow-xl flex flex-col h-[100dvh] transform transition-transform duration-300 ease-out ${
              isMobileMenuOpen ? "translate-y-0" : "-translate-y-full"
            }`}
          >
            {/* Menu Header - Fixed at top */}
            <div className="flex justify-between items-center py-4 px-6 border-b border-gray-200 bg-white">
              <Link href="/" onClick={closeMobileMenu}>
                <Image
                  src="/assets/RabbitLogo.png"
                  alt="Rabbit Autocare"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                />
              </Link>
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                onClick={closeMobileMenu}
                aria-label="Close menu"
              >
                <X size={24} className="text-gray-600" strokeWidth={1.5} />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-4">
                {/* Categories Section */}
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-4 text-gray-800">Categories</h3>
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="text-gray-500">Loading categories...</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {categories.map((category, index) => (
                        <Link key={index} href={category.href} className="block group" onClick={closeMobileMenu}>
                          <div className="overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 bg-white">
                            <div className="relative aspect-[3/2] bg-gray-100">
                              <img
                                src={
                                  categoryImageMap[category.name.toLowerCase().replace(/\s+/g, "-")] ||
                                  "/placeholder.svg?height=200&width=300" ||
                                  "/placeholder.svg"
                                }
                                alt={category.name}
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                                onError={(e) => {
                                  e.target.src = "/placeholder.svg?height=200&width=300"
                                }}
                              />
                            </div>
                            <div className="bg-black text-white py-2 px-3 text-center">
                              <span className="font-medium text-xs">{category.name}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Navigation Links */}
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <h3 className="font-semibold text-lg mb-4 text-gray-800">Navigation</h3>
                  <div className="space-y-0">
                    {navLinks.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        className="block py-4 text-base font-medium text-gray-800 hover:text-gray-600 hover:bg-gray-50 px-3 rounded-lg transition-colors border-b border-gray-100 last:border-b-0"
                        onClick={closeMobileMenu}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Theme Toggle */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    className="flex items-center gap-3 hover:bg-gray-50 w-full justify-start p-3 rounded-lg transition-colors"
                    onClick={toggleTheme}
                  >
                    {theme === "dark" ? (
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
                      >
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                      </svg>
                    ) : (
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
                      >
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                    )}
                    <span className="text-sm font-medium">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
