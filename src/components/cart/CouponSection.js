'use client';
import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { Check, Ticket, X, Loader2 } from 'lucide-react';

export default function CouponSection() {
  const { 
    coupon, 
    applyCoupon, 
    couponLoading, 
    couponError,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    applyCoupon(couponCode);
  };

  const handleRemoveCoupon = () => {
    applyCoupon(null);
    setCouponCode('');
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
        <Ticket size={16} className="text-blue-600" />
        Apply Coupon
      </h4>

      {coupon ? (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded p-3">
          <div className="flex items-center gap-2">
            <div className="bg-green-100 rounded-full p-1">
              <Check size={14} className="text-green-600" />
            </div>
            <div>
              <span className="text-sm font-medium">{coupon.code}</span>
              <p className="text-xs text-gray-600">{coupon.description}</p>
            </div>
          </div>
          <button 
            onClick={handleRemoveCoupon}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <form onSubmit={handleApplyCoupon} className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            className="flex-1 border rounded px-3 py-2 text-sm focus:outline-blue-500"
          />
          <button
            type="submit"
            disabled={couponLoading || !couponCode}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded text-sm min-w-16"
          >
            {couponLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Apply'}
          </button>
        </form>
      )}

      {couponError && (
        <p className="text-red-500 text-xs mt-2">{couponError}</p>
      )}
    </div>
  );
}