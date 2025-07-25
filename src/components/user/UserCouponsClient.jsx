'use client';

import UserLayout from '@/components/layouts/UserLayout';
import CouponCard from '@/components/ui/CouponCard';
import '@/app/globals.css';

export default function UserCouponsClient({ initialUserCoupons, initialAvailableCoupons }) {
  const hasUserCoupons = initialUserCoupons && initialUserCoupons.length > 0;
  const hasAvailableCoupons = initialAvailableCoupons && initialAvailableCoupons.length > 0;

  return (
    <UserLayout>
      <div className='max-w-7xl mx-auto p-6'>
        <h1 className='text-3xl font-bold mb-8'>Your Coupons</h1>

        {hasUserCoupons && (
          <div className="mb-12">
            {/* Consistent grid layout with fixed spacing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {initialUserCoupons.map((coupon) => (
                <CouponCard
                  key={`user-${coupon.id}`}
                  code={coupon.code}
                  discount={coupon.discount}
                  validUpto={coupon.validUpto}
                />
              ))}
            </div>
          </div>
        )}

        {hasAvailableCoupons && (
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Available For You</h2>
            {/* Consistent grid layout matching user coupons */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
              {initialAvailableCoupons.map((coupon) => (
                <CouponCard
                  key={`avail-${coupon.id}`}
                  code={coupon.code}
                  discount={coupon.discount}
                  validUpto={coupon.validUpto}
                />
              ))}
            </div>
          </div>
        )}

        {!hasUserCoupons && !hasAvailableCoupons && (
          <div className='bg-white p-12 rounded-xl shadow-md text-center'>
            <svg className="mx-auto mb-6 w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className='text-2xl font-medium mb-3'>No Coupons Available</h3>
            <p className='text-gray-600 text-lg'>
              You don&apos;t have any available coupons at the moment. Check back later for exciting offers!
            </p>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
