'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, ShoppingCart } from 'lucide-react';
import cartService from '@/lib/service/cartService';
import { useAuth } from '@/contexts/AuthContext';

export default function CartDropdown({ isOpen, onClose }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        if (!user?.id) return;
        const { cartItems: items } = await cartService.getCartItems(user.id);
        setCartItems(items || []);
      } catch (error) {
        console.error('Error fetching cart items:', error);

        // Fallback to localStorage
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
          try {
            const items = JSON.parse(storedCart);
            if (Array.isArray(items)) {
              setCartItems(items);
            }
          } catch (e) {
            console.error('Error parsing stored cart:', e);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchCartItems();
    }
  }, [isOpen, user?.id]);

  const handleRemoveItem = async (itemId) => {
    try {
      await cartService.removeFromCart(itemId, user.id);
      setCartItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error removing item:', error);

      // Fallback to localStorage
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        try {
          const items = JSON.parse(storedCart);
          if (Array.isArray(items)) {
            const updatedItems = items.filter(item => item.id !== itemId);
            localStorage.setItem('cart', JSON.stringify(updatedItems));
            setCartItems(updatedItems);
          }
        } catch (e) {
          console.error('Error updating stored cart:', e);
        }
      }
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + ((item.variant?.price || item.product?.price || item.price || 0) * item.quantity), 0);

  return (
    <div
      ref={dropdownRef}
      className={`fixed top-0 right-0 h-full w-full md:w-[400px] bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Shopping Cart ({totalItems} items)</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            </div>
          ) : cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ShoppingCart className="w-16 h-16 mb-4" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 p-2 border-b">
                  <div className="relative w-20 h-20">
                    <Image
                      src={
                        item.product?.main_image_url || item.product?.image_url || item.productImage || '/placeholder.svg'
                      }
                      alt={item.product?.name || item.productName || 'Product'}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product?.name || item.productName || 'Unknown Product'}</h3>
                    <p className="text-sm text-gray-600">{item.variant?.size || item.variant || 'Default'}</p>
                    <p className="text-sm font-medium">
                      {formatPrice(item.variant?.price || item.product?.price || item.price || 0)}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm">Qty: {item.quantity}</span>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="flex justify-between mb-4">
            <span className="font-medium">Total:</span>
            <span className="font-bold">{formatPrice(totalPrice)}</span>
          </div>
          <Link
            href="/checkout"
            className="block w-full bg-black text-white text-center py-3 rounded hover:bg-gray-800 transition-colors"
            onClick={onClose}
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
