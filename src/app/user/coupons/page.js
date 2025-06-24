// File: src/pages/user/coupons.js
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import UserLayout from '@/components/layouts/UserLayout';
import '@/app/globals.css';
import { useAuth } from '@/hooks/useAuth';

export default function UserCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, sessionChecked } = useAuth();

  useEffect(() => {
    // Only fetch coupons if we have confirmed the session state
    if (sessionChecked) {
      if (user) {
        fetchCoupons(user.id);
      } else {
        setLoading(false);
      }
    }
  }, [user, sessionChecked]);

  const fetchCoupons = async (userId) => {
    try {
      setLoading(true);
      // Fetch all active coupons
      const { data: allCoupons, error: couponsError } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (couponsError) throw couponsError;

      // Fetch user's used coupons
      const { data: usedCoupons, error: usedError } = await supabase
        .from('user_coupons')
        .select('coupon_id')
        .eq('user_id', userId);

      if (usedError) throw usedError;

      // Filter out expired and used coupons
      const now = new Date();
      const usedCouponIds = new Set(usedCoupons.map((uc) => uc.coupon_id));

      const availableCoupons = allCoupons.filter((coupon) => {
        // Check if coupon is not used
        if (usedCouponIds.has(coupon.id)) return false;

        // Check if coupon is not expired
        if (!coupon.is_permanent && new Date(coupon.expiry_date) < now)
          return false;

        return true;
      });

      setCoupons(availableCoupons);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never expires';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Show loading state while session is being checked
  if (!sessionChecked) {
    return (
      <UserLayout>
        <div className='p-6 flex items-center justify-center'>
          <div className='bg-white p-8 rounded-lg shadow-md'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto'></div>
            <p className='text-center mt-4'>Initializing...</p>
          </div>
        </div>
      </UserLayout>
    );
  }

  // Show loading state while fetching coupons
  if (loading) {
    return (
      <UserLayout>
        <div className='p-6 flex items-center justify-center'>
          <div className='bg-white p-8 rounded-lg shadow-md'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto'></div>
            <p className='text-center mt-4'>Loading coupons...</p>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className='max-w-4xl mx-auto p-6'>
        <h1 className='text-2xl font-bold mb-6'>Your Coupons</h1>

        {coupons.length === 0 ? (
          <div className='bg-white p-8 rounded-lg shadow-md text-center'>
            <h3 className='text-xl font-medium mb-2'>No Coupons Available</h3>
            <p className='text-gray-600'>
              You don&apos;t have any available coupons at the moment.
            </p>
          </div>
        ) : (
          <div className='grid md:grid-cols-2 gap-4'>
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className='bg-white rounded-lg shadow-md overflow-hidden border-2 border-dashed border-gray-300'
              >
                <div className='bg-blue-600 text-white px-4 py-2 font-medium flex justify-between items-center'>
                  <span>Discount Coupon</span>
                  <span>{coupon.discount_percent}% OFF</span>
                </div>

                <div className='p-4'>
                  <div className='flex justify-between items-center mb-2'>
                    <h3 className='text-lg font-bold tracking-wider'>
                      {coupon.code}
                    </h3>
                    <span className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded'>
                      {coupon.is_permanent ? 'PERMANENT' : 'LIMITED TIME'}
                    </span>
                  </div>

                  <p className='text-gray-600 mb-3'>{coupon.description}</p>

                  <div className='text-sm'>
                    <p className='flex justify-between'>
                      <span className='text-gray-600'>Min. Order:</span>
                      <span className='font-medium'>
                        ₹{coupon.min_order_amount}
                      </span>
                    </p>
                    <p className='flex justify-between'>
                      <span className='text-gray-600'>Valid Till:</span>
                      <span className='font-medium'>
                        {formatDate(coupon.expiry_date)}
                      </span>
                    </p>
                  </div>

                  <div className='mt-4 text-center'>
                    <button
                      className='px-4 py-2 rounded-full bg-green-600 text-white hover:bg-green-700'
                      onClick={() => {
                        // Copy code to clipboard
                        navigator.clipboard
                          .writeText(coupon.code)
                          .then(() =>
                            alert(`${coupon.code} copied to clipboard!`)
                          );
                      }}
                    >
                      Copy Code
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
