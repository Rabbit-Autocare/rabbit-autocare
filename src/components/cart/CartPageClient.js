'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import CartItem from './CartItem';
import CouponSection from './CouponSection';
import PriceSummary from './PriceSummary';
import FrequentlyBoughtTogether from './FrequentlyBoughtTogether';
import Link from 'next/link';
import { ShoppingCart, ArrowLeft } from 'lucide-react';

export default function CartPageClient({
  initialCartItems = [],
  initialCombos = [],
  initialCoupons = [],
  initialError = null,
}) {
  const { user, sessionChecked } = useAuth();
  const { cartItems, loading, cartCount } = useCart();

  const [isInitialized, setIsInitialized] = useState(false);
  const [showInitialData, setShowInitialData] = useState(true);

  // Use initial data until cart context is properly loaded
  useEffect(() => {
    if (sessionChecked && !loading) {
      setIsInitialized(true);
      setShowInitialData(false);
    }
  }, [sessionChecked, loading]);

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

  // Determine which data to show
  const currentCartItems = showInitialData ? initialCartItems : cartItems;
  const isLoading =
    !sessionChecked || (sessionChecked && loading && !isInitialized);

  if (initialError) {
    return (
      <div className='min-h-screen bg-gray-50 py-8'>
        <div className='max-w-4xl mx-auto px-4'>
          <div className='bg-red-50 border border-red-200 rounded-lg p-6 text-center'>
            <h2 className='text-xl font-semibold text-red-800 mb-2'>
              Error Loading Cart
            </h2>
            <p className='text-red-600 mb-4'>{initialError}</p>
            <Link
              href='/shop'
              className='inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors'
            >
              <ArrowLeft className='mr-2' size={16} />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 py-8'>
        <div className='max-w-4xl mx-auto px-4'>
          <div className='animate-pulse'>
            <div className='h-8 bg-gray-300 rounded mb-6 w-1/3'></div>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
              <div className='lg:col-span-2 space-y-4'>
                {[1, 2, 3].map((i) => (
                  <div key={i} className='bg-white rounded-lg p-4'>
                    <div className='flex space-x-4'>
                      <div className='w-20 h-20 bg-gray-300 rounded'></div>
                      <div className='flex-1 space-y-2'>
                        <div className='h-4 bg-gray-300 rounded w-3/4'></div>
                        <div className='h-4 bg-gray-300 rounded w-1/2'></div>
                        <div className='h-4 bg-gray-300 rounded w-1/4'></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className='space-y-4'>
                <div className='bg-white rounded-lg p-4'>
                  <div className='h-6 bg-gray-300 rounded mb-4 w-1/2'></div>
                  <div className='space-y-2'>
                    <div className='h-4 bg-gray-300 rounded'></div>
                    <div className='h-4 bg-gray-300 rounded'></div>
                    <div className='h-4 bg-gray-300 rounded'></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-4xl mx-auto px-4'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Your Cart</h1>
            {currentCartItems.length > 0 && (
              <p className='text-gray-600 mt-1'>
                {currentCartItems.length}{' '}
                {currentCartItems.length === 1 ? 'item' : 'items'} in your cart
              </p>
            )}
          </div>
          <Link
            href='/shop'
            className='inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors'
          >
            <ArrowLeft className='mr-2' size={16} />
            Continue Shopping
          </Link>
        </div>

        {currentCartItems.length === 0 ? (
          <div className='bg-white rounded-lg shadow-sm p-8 text-center'>
            <div className='bg-gray-100 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center'>
              <ShoppingCart size={32} className='text-gray-400' />
            </div>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>
              Your cart is empty
            </h2>
            <p className='text-gray-600 mb-6'>
              Looks like you haven&apos;t added any products to your cart yet.
            </p>
            <Link
              href='/shop'
              className='inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors'
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Cart Items */}
            <div className='lg:col-span-2 space-y-6'>
              <div className='bg-white rounded-lg shadow-sm'>
                <div className='border-b border-gray-200 p-4'>
                  <h2 className='text-lg font-semibold text-gray-900'>
                    Review Your Items
                  </h2>
                </div>
                <div className='p-4 space-y-4'>
                  {currentCartItems.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      formatPrice={formatPrice}
                      getVariantDisplayText={getVariantDisplayText}
                    />
                  ))}
                </div>
              </div>

              {/* Frequently Bought Together */}
              {/* <FrequentlyBoughtTogether initialCombos={initialCombos} /> */}
            </div>

            {/* Sidebar */}
            <div className='space-y-6'>
              {/* Coupon Section */}
              <CouponSection initialCoupons={initialCoupons} />

              {/* Price Summary */}
              <PriceSummary formatPrice={formatPrice} />

              {/* Checkout Button */}
              <div className='bg-white rounded-lg shadow-sm p-4'>
                <Link
                  href='/checkout'
                  className='w-full bg-black hover:bg-gray-800 text-white py-3 px-4 rounded-lg font-medium transition-colors text-center block'
                >
                  Proceed to Checkout
                </Link>
                <p className='text-xs text-gray-500 text-center mt-2'>
                  Secure checkout with SSL encryption
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
