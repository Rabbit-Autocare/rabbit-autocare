// File: src/pages/user/coupons.js
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import UserLayout from '@/components/layouts/UserLayout';
import '@/app/globals.css';
import { useAuth } from '@/hooks/useAuth';
import { UserService } from "@/lib/service/userService";
import CouponCard from "@/components/ui/CouponCard";

export default function UserCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [userCoupons, setUserCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, sessionChecked, loading: authLoading } = useAuth();

  useEffect(() => {
    // Only fetch coupons if we have confirmed the session state
    if (sessionChecked) {
      if (user) {
        fetchCoupons(user.id);
        fetchUserCoupons(user.id);
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

  // Fetch user's coupons using UserService
  const fetchUserCoupons = async (userId) => {
    try {
      const result = await UserService.getUserCoupons(userId);
      if (result.success) {
        setUserCoupons(result.data);
      }
    } catch (error) {
      console.error('Error fetching user coupons:', error);
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
  if (!sessionChecked || authLoading) {
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

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <UserLayout>
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-16 bg-white rounded-xl shadow-lg">
            <svg className="mx-auto mb-6 w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="text-2xl font-semibold text-gray-600 mb-3">Please Log In</h3>
            <p className="text-gray-500 mb-6 text-lg">You need to be logged in to view your coupons</p>
            <Link href="/login" className="inline-block bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 transition-colors font-semibold text-lg">
              Login Now
            </Link>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className='max-w-7xl mx-auto p-6'>
        <h1 className='text-3xl font-bold mb-8'>Your Available Coupons</h1>

        {/* Display CouponCard components if userCoupons exist */}
        {userCoupons.length > 0 && (
          <div className="mb-10">
            {/* <h2 className="text-2xl font-semibold mb-6 text-gray-800">Your Special Coupons</h2> */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {userCoupons.map((coupon, idx) => (
                <CouponCard
                  key={coupon.id || idx}
                  code={coupon.code}
                  discount={coupon.discount}
                  validUpto={coupon.expiry}
                />
              ))}
            </div>
          </div>
        )}

        {/* Display regular coupons */}
        {coupons.length === 0 && userCoupons.length === 0 ? (
          <div className='bg-white p-12 rounded-xl shadow-md text-center'>
            <svg className="mx-auto mb-6 w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className='text-2xl font-medium mb-3'>No Coupons Available</h3>
            <p className='text-gray-600 text-lg'>
              You don&apos;t have any available coupons at the moment. Check back later for exciting offers!
            </p>
          </div>
        ) : (
          <>
            {coupons.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-gray-800">Available Coupons</h2>
                <div className='grid md:grid-cols-2 xl:grid-cols-3 gap-6'>
                  {coupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className='bg-white rounded-xl shadow-lg overflow-hidden border-2 border-dashed border-gray-300 hover:shadow-xl transition-shadow duration-300'
                    >
                      <div className='bg-blue-600 text-white px-6 py-4 font-medium flex justify-between items-center'>
                        <span className="text-lg">Discount Coupon</span>
                        <span className="text-xl font-bold">{coupon.discount_percent}% OFF</span>
                      </div>

                      <div className='p-6'>
                        <div className='flex justify-between items-center mb-4'>
                          <h3 className='text-xl font-bold tracking-wider text-gray-800'>
                            {coupon.code}
                          </h3>
                          <span className='text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium'>
                            {coupon.is_permanent ? 'PERMANENT' : 'LIMITED TIME'}
                          </span>
                        </div>

                        <p className='text-gray-600 mb-4 text-base leading-relaxed'>{coupon.description}</p>

                        <div className='text-base space-y-2 mb-6'>
                          <p className='flex justify-between'>
                            <span className='text-gray-600'>Min. Order:</span>
                            <span className='font-semibold text-gray-800'>
                              ₹{coupon.min_order_amount}
                            </span>
                          </p>
                          <p className='flex justify-between'>
                            <span className='text-gray-600'>Valid Till:</span>
                            <span className='font-semibold text-gray-800'>
                              {formatDate(coupon.expiry_date)}
                            </span>
                          </p>
                        </div>

                        <div className='text-center'>
                          <button
                            className='px-6 py-3 rounded-full bg-green-600 text-white hover:bg-green-700 font-semibold text-base transition-colors duration-200 w-full'
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
              </div>
            )}
          </>
        )}
      </div>
    </UserLayout>
  );
}
