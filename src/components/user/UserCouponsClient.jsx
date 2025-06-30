'use client';

import UserLayout from '@/components/layouts/UserLayout';
import CouponCard from '@/components/ui/CouponCard';
import '@/app/globals.css';

export default function UserCouponsClient({ initialUserCoupons, initialAvailableCoupons }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'Never expires';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <UserLayout>
      <div className='max-w-7xl mx-auto p-6'>
        <h1 className='text-3xl font-bold mb-8'>Your Available Coupons</h1>

        {/* Display CouponCard components if userCoupons exist */}
        {initialUserCoupons.length > 0 && (
          <div className="mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {initialUserCoupons.map((coupon, idx) => (
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
        {initialAvailableCoupons.length === 0 && initialUserCoupons.length === 0 ? (
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
            {initialAvailableCoupons.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-gray-800">Available Coupons</h2>
                <div className='grid md:grid-cols-2 xl:grid-cols-3 gap-6'>
                  {initialAvailableCoupons.map((coupon) => (
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
