'use client';
import { useCart } from '@/hooks/useCart';
import { Drawer } from '../ui/drawer';
import CartItem from './CartItem';
import CouponSection from './CouponSection';
import PriceSummary from './PriceSummary';
import Link from 'next/link';
import { ShoppingCart, X, AlertCircle } from 'lucide-react';

export default function CartDrawer() {
  const { isCartOpen, closeCart, cartItems, loading, cartCount } = useCart();

  return (
    <Drawer
      isOpen={isCartOpen}
      onClose={closeCart}
      position='right'
      className='w-full sm:w-96 max-w-full flex flex-col'
    >
      {/* Cart header */}
      <div className='p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10'>
        <div className='flex items-center gap-2'>
          <ShoppingCart size={20} />
          <h2 className='text-lg font-semibold'>Your Cart</h2>
          {cartCount > 0 && (
            <span className='bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full'>
              {cartCount}
            </span>
          )}
        </div>
        <button
          onClick={closeCart}
          className='rounded-full p-1 hover:bg-gray-100'
          aria-label='Close cart'
        >
          <X size={20} />
        </button>
      </div>

      {/* Cart content */}
      <div className='flex-1 overflow-y-auto p-4'>
        {loading ? (
          <div className='flex flex-col items-center justify-center h-64'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4'></div>
            <p className='text-gray-600'>Loading your cart...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-64 text-center'>
            <div className='bg-gray-100 p-4 rounded-full mb-4'>
              <ShoppingCart size={32} className='text-gray-500' />
            </div>
            <h3 className='text-xl font-semibold mb-2'>Your cart is empty</h3>
            <p className='text-gray-600 mb-6'>
              Looks like you haven&apos;t added any products to your cart yet.
            </p>
            <button
              onClick={closeCart}
              className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded'
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className='space-y-6'>
            <div className='space-y-4'>
              {cartItems.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            <CouponSection />
            <PriceSummary />
          </div>
        )}
      </div>

      {/* Cart footer */}
      {cartItems.length > 0 && (
        <div className='border-t p-4 bg-white sticky bottom-0 z-10'>
          <Link
            href='/checkout'
            onClick={closeCart}
            className='bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded w-full block text-center font-medium'
          >
            Checkout
          </Link>
          <button
            onClick={closeCart}
            className='w-full text-gray-600 hover:text-gray-800 mt-3 text-sm font-medium'
          >
            Continue Shopping
          </button>
        </div>
      )}
    </Drawer>
  );
}
