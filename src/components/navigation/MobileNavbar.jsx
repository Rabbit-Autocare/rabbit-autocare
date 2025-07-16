'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
// import { useTheme } from '@/contexts/ThemeContext';
import { useCart } from '@/hooks/useCart';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import CouponCard from '@/components/ui/CouponCard';
import { ClientUserService } from '@/lib/service/client-userService';
import { SEARCH_MAP } from "@/utils/searchKeywords";

const categoryImageMap = {
  'car-interior': '/assets/images/carinterior.png',
  'car-exterior': '/assets/images/banner2.png',
  'kits&combos': '/assets/images/banner.png',
  'microfiber-cloth': '/assets/images/mission.png',
};

const navLinks = [
  { name: 'HOME', href: '/' },
  { name: 'PRODUCTS', href: '/shop/all' },
  // { name: 'BLOGS', href: '/blog' },
  { name: 'ABOUT RABBIT AUTOCARE', href: '/about' },
  { name: 'GET IN TOUCH', href: '/contact' },
];

const coupons = [
  {
    code: 'SAVE20',
    description: '20% off on all products',
    discount: '20% OFF',
  },
  {
    code: 'FIRST10',
    description: '10% off for first-time buyers',
    discount: '10% OFF',
  },
];

const STATIC_CATEGORIES = [
  {
    name: 'Car Interior',
    href: '/shop/car-interior',
    image: '/assets/images/carinterior.png',
  },
  {
    name: 'Car Exterior',
    href: '/shop/car-exterior',
    image: '/assets/images/banner2.png',
  },
  {
    name: 'Microfiber Cloth',
    href: '/shop/microfiber-cloth',
    image: '/assets/images/mission.png',
  },
  {
    name: 'Kits & Combos',
    href: '/shop/kits-combos',
    image: '/assets/images/banner.png',
  },
];

export default function MobileNavbar({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) {
  const [showCoupons, setShowCoupons] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // const { theme, toggleTheme } = useTheme();
  const { openCart, cartCount } = useCart();
  const [userCoupons, setUserCoupons] = useState([]);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const { user, loading: authLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);

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
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      setIsLoggedIn(loggedIn);
    };

    checkLoginStatus();
    window.addEventListener('storage', checkLoginStatus);
    return () => window.removeEventListener('storage', checkLoginStatus);
  }, []);

  // Fetch user's coupons (updated to fetch both userCoupons and availableCoupons)
  useEffect(() => {
    const fetchCoupons = async () => {
      if (user?.id) {
        const { success, data, error } = await ClientUserService.getUserCoupons(user.id);
        if (success) {
          setUserCoupons(data.userCoupons || []);
          setAvailableCoupons(data.availableCoupons || []);
        } else {
          setUserCoupons([]);
          setAvailableCoupons([]);
        }
      } else {
        setUserCoupons([]);
        setAvailableCoupons([]);
      }
    };
    if (!authLoading) {
      fetchCoupons();
    }
  }, [user?.id, authLoading]);

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

  const closeMobileMenu = () => {
    if (!isReady) return;
    setIsMobileMenuOpen(false);
    setShowCoupons(false);
  };

  const toggleMobileMenu = () => {
    if (!isReady) return;
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (showCoupons) {
      setShowCoupons(false);
    }
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className='bg-white border-b border-gray-200 py-3 px-4 relative z-[100000]'>
        <div className='flex justify-between items-center'>
          {/* Hamburger Menu */}
          <button
            className='p-1 hover:bg-gray-100 rounded-md transition-colors'
            onClick={toggleMobileMenu}
            aria-label='Toggle menu'
          >
            {isMobileMenuOpen ? (
              <X size={24} className='text-gray-600' strokeWidth={1.5} />
            ) : (
              <Menu size={24} className='text-gray-600' strokeWidth={1.5} />
            )}
          </button>

          {/* Logo */}
          <Link href='/' className='flex-1 flex justify-center'>
            <Image
              src='/assets/RabbitLogo.png'
              alt='Rabbit Autocare'
              width={120}
              height={40}
              className='h-8 w-auto'
            />
          </Link>

          {/* Icons */}
          <div className='flex items-center space-x-3'>
            {/* User Icon */}
            {isLoggedIn ? (
              <Link href='/profile'>
                <button className='p-1 hover:bg-gray-100 rounded-md transition-colors'>
                  <Image
                    src='/assets/account.svg'
                    alt='user'
                    width={18}
                    height={18}
                  />
                  <span className='sr-only'>User Profile</span>
                </button>
              </Link>
            ) : (
              <Link href='/login'>
                <button className='p-1 hover:bg-gray-100 rounded-md transition-colors'>
                  <Image
                    src='/assets/account.svg'
                    alt='user'
                    width={18}
                    height={18}
                  />
                  <span className='sr-only'>User account</span>
                </button>
              </Link>
            )}
            {/* Wishlist Icon */}
            <Link href="/wishlist" aria-label="Go to Shine List">
              <button className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                <Image
                  src="/assets/shine.svg"
                  alt="wishlist"
                  width={18}
                  height={18}
                />
                <span className="sr-only">Shine List</span>
              </button>
            </Link>
            {/* Cart Icon */}
            <button
              onClick={openCart}
              className='relative p-1 hover:bg-gray-100 rounded-md transition-colors'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='18'
                height='18'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <circle cx='9' cy='21' r='1' />
                <circle cx='20' cy='21' r='1' />
                <path d='M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6' />
              </svg>
              {cartCount > 0 && (
                <span className='absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center'>
                  {cartCount}
                </span>
              )}
              <span className='sr-only'>Cart</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className='bg-white border-b border-gray-200 py-3 px-4 relative z-50'>
        <form onSubmit={handleSearch} className='relative'>
          <input
            type='search'
            placeholder='Search for microfiber clothes or any other product...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full pl-4 pr-12 py-2.5 text-sm border-b border-gray-300 focus:outline-none focus:border-gray-500 bg-transparent'
          />
          <button
            type='submit'
            className='absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-md transition-colors'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='text-gray-500'
            >
              <circle cx='11' cy='11' r='8' />
              <line x1='21' y1='21' x2='16.65' y2='16.65' />
            </svg>
            <span className='sr-only'>Search</span>
          </button>
        </form>
      </div>

      {/* Coupons Dropdown */}
      {showCoupons && (
        <div className='bg-white border-b border-gray-200 shadow-lg relative z-40'>
          <div className='px-4 py-4'>
            <div className='coupon-scroll-area max-h-80 overflow-y-auto'>
              {authLoading ? (
                <div className='text-center '>
                  <p className='text-gray-500'>Loading...</p>
                </div>
              ) : user ? (
                availableCoupons && availableCoupons.length > 0 ? (
                  <div className='space-y-3 mb-3'>
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
                  <div className='text-center py-8 text-gray-500'>
                    <svg
                      className='mx-auto mb-3 w-12 h-12 text-gray-300'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                    <p>No coupons available</p>
                  </div>
                )
              ) : (
                <div className='text-center py-8'>
                  <svg
                    className='mx-auto mb-3 w-12 h-12 text-gray-300'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                    />
                  </svg>
                  <p className='text-gray-500 mb-3'>
                    Please log in to view your coupons
                  </p>
                  <Link
                    href='/login'
                    className='inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors'
                  >
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
        <div className='fixed inset-0 z-[100001] flex flex-col'>
          {/* Backdrop */}
          <div
            className='absolute inset-0 bg-black/60'
            onClick={closeMobileMenu}
            aria-hidden='true'
          />

          {/* Menu Panel */}
          <div
            className={`relative w-full bg-white shadow-xl flex flex-col h-[100dvh] transform transition-transform duration-300 ease-out ${
              isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
            }`}
          >
            {/* Menu Header - Fixed at top */}
            <div className='flex justify-between items-center py-4 px-6 border-b border-gray-200 bg-white'>
              <Link href='/' onClick={closeMobileMenu}>
                <Image
                  src='/assets/RabbitLogo.png'
                  alt='Rabbit Autocare'
                  width={120}
                  height={40}
                  className='h-8 w-auto'
                />
              </Link>
              <button
                className='p-2 hover:bg-gray-100 rounded-full transition-colors'
                onClick={closeMobileMenu}
                aria-label='Close menu'
              >
                <X size={24} className='text-gray-600' strokeWidth={1.5} />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className='flex-1 overflow-y-auto'>
              <div className='px-6 py-4'>
                {/* Categories Section */}
                <div className='mb-6'>
                  <h3 className='font-semibold text-lg mb-4 text-gray-800'>
                    Categories
                  </h3>
                  <div className='grid grid-cols-2 gap-4'>
                    {STATIC_CATEGORIES.map((category, index) => (
                      <Link
                        key={index}
                        href={category.href}
                        className='block group'
                        onClick={closeMobileMenu}
                      >
                        <div className='overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 bg-white'>
                          <div className='relative aspect-[3/2] bg-gray-100'>
                            <img
                              src={category.image}
                              alt={category.name}
                              className='object-cover w-full h-full group-hover:scale-105 transition-transform duration-200'
                              onError={(e) => {
                                e.target.src =
                                  '/placeholder.svg?height=200&width=300';
                              }}
                            />
                          </div>
                          <div className='bg-black text-white py-2 px-3 text-center'>
                            <span className='font-medium text-xs'>
                              {category.name}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Navigation Links */}
                <div className='border-t border-gray-200 pt-6 mb-6'>
                  <h3 className='font-semibold text-lg mb-4 text-gray-800'>
                    Navigation
                  </h3>
                   {/* Profile Dropdown inside Navigation */}
                   <details className='mb-2'>
                      <summary className='font-semibold text-base text-gray-800 py-3 px-3 rounded-lg cursor-pointer hover:bg-gray-50 flex items-center justify-between'>
                        Your Profile
                        <span className='ml-2'>&#8250;</span>
                      </summary>
                      <div className='pl-4 mt-2 space-y-2'>
                        <Link href={isLoggedIn ? '/profile' : '/login'} className='block py-2 text-gray-700 hover:text-gray-900' onClick={closeMobileMenu}>Account</Link>
                        <Link href='/user/coupons' className='block py-2 text-gray-700 hover:text-gray-900' onClick={closeMobileMenu}>Coupons</Link>
                      </div>
                    </details>
                  <div className='space-y-0'>
                    {navLinks.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        className='block py-4 text-base font-medium text-gray-800 hover:text-gray-600 hover:bg-gray-50 px-3 rounded-lg transition-colors border-b border-gray-100 last:border-b-0'
                        onClick={closeMobileMenu}
                      >
                        {link.name}
                      </Link>
                    ))}

                  </div>
                </div>


              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
