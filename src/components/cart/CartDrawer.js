'use client';

import { useCart } from '@/hooks/useCart';
import CartItem from './CartItem';
import CouponSection from './CouponSection';
import PriceSummary from './PriceSummary';
// import FrequentlyBoughtTogether from './FrequentlyBoughtTogether';
import Link from 'next/link';
import { ShoppingCart, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

export default function CartDrawer() {
  const {
    isCartOpen,
    closeCart,
    cartItems,
    combos,
    availableCoupons,
    loading,
    cartCount,
    coupon,
    couponError,
    couponLoading,
    applyCoupon,
    clearCoupon,
    updateItemPrice,
  } = useCart();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isCartOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isCartOpen]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getVariantDisplayText = (variant) => {
    if (!variant) return 'Default';
    if (
      variant.size &&
      (variant.size.includes('x') || variant.size.match(/\d+\s*cm/))
    ) {
      let size = variant.size
        .replace(/(ml|ltr|l|gm|g|kg|pcs?|pieces?)/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (!/cm$/i.test(size)) size = size + ' cm';
      return size;
    }
    const quantity = variant.quantity || variant.size || '';
    const unit = variant.unit || '';
    return `${quantity}${unit}` || 'Variant';
  };

  const handleScrollableAreaScroll = (e) => {
    e.stopPropagation();
  };

  const handleWheel = (e) => {
    const scrollableArea = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = scrollableArea;
    if (e.deltaY < 0 && scrollTop === 0) {
      e.preventDefault();
      return;
    }
    if (e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
  };

  if (!mounted) return null;

  const cartContent = (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999998,
              margin: 0,
              padding: 0,
            }}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '100%',
              maxWidth: '384px',
              height: '100vh',
              backgroundColor: 'white',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              zIndex: 999999,
              display: 'flex',
              flexDirection: 'column',
              margin: 0,
              padding: 0,
              transform: 'translateZ(0)',
            }}
            onWheel={(e) => e.stopPropagation()}
          >
            <div
              style={{
                flexShrink: 0,
                padding: '16px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'white',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                position: 'relative',
                zIndex: 1000001,
              }}
            >
              <button
                onClick={closeCart}
                className='rounded-full p-1 hover:bg-gray-100 mr-2 transition-colors'
                aria-label='Close cart'
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className='text-lg font-semibold'>Your Cart</h2>
              {cartCount > 0 && (
                <span className='bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full ml-auto'>
                  {cartCount}
                </span>
              )}
            </div>

            {/* <div
              style={{
                flexShrink: 0,
                backgroundColor: '#9333ea',
                color: 'white',
                textAlign: 'center',
                padding: '8px 0',
                fontSize: '14px',
                fontWeight: '500',
                position: 'relative',
                zIndex: 1000001,
              }}
            >
              Save extra 5% on prepaid orders
            </div> */}

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch',
                minHeight: 0,
                position: 'relative',
              }}
              onScroll={handleScrollableAreaScroll}
              onWheel={handleWheel}
            >
              {loading ? (
                <div className='flex flex-col items-center justify-center h-full p-4'>
                  <Image
                    src='/assets/loader.gif'
                    alt='Loading...'
                    width={96}
                    height={96}
                    className='h-24 w-24 mx-auto mb-4'
                  />
                  <p className='text-gray-600'>Loading your cart...</p>
                </div>
              ) : cartItems.length === 0 ? (
                <div className='flex flex-col items-center justify-center h-full text-center p-4'>
                  <div className='bg-gray-100 p-4 rounded-full mb-4'>
                    <ShoppingCart size={32} className='text-gray-500' />
                  </div>
                  <h3 className='text-xl font-semibold mb-2'>
                    Your cart is empty
                  </h3>
                  <p className='text-gray-600 mb-6'>
                    Looks like you don&apos;t have any products in your cart
                    yet.
                  </p>
                  <button
                    onClick={closeCart}
                    className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition-colors'
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className='p-4 space-y-6'>
                  <div>
                    <h3 className='text-lg font-semibold mb-4'>
                      Review Your Items
                    </h3>
                    <div className='space-y-4'>
                      {cartItems.map((item) => (
                        <CartItem
                          key={item.id}
                          item={item}
                          formatPrice={formatPrice}
                          getVariantDisplayText={getVariantDisplayText}
                        />
                      ))}
                    </div>
                  </div>

                  {/* <FrequentlyBoughtTogether /> */}

                  <CouponSection />

                  <PriceSummary formatPrice={formatPrice} />

                  <div className='h-4'></div>
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div
                style={{
                  flexShrink: 0,
                  borderTop: '1px solid #e5e7eb',
                  padding: '16px',
                  backgroundColor: 'white',
                  boxShadow: '0 -1px 3px 0 rgba(0, 0, 0, 0.1)',
                  position: 'relative',
                  zIndex: 1000001,
                }}
              >
                <Link
                  href='/checkout'
                  onClick={closeCart}
                  className='bg-black hover:bg-gray-800 text-white py-3 px-4 rounded w-full block text-center font-medium transition-colors'
                >
                  Proceed To Checkout
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(cartContent, document.body);
}
