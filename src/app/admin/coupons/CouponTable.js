'use client';

import { Plus, AlertCircle, Trash2, Gift } from 'lucide-react';

export default function CouponTable({
  coupons,
  loading,
  error,
  activeCount,
  MAX_ACTIVE_COUPONS,
  handleAddNew,
  handleDelete,
  isExpired,
  formatDate,
}) {
  return (
    <>
      {/* Header */}
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-semibold text-gray-900'>Coupons</h1>
        <button
          onClick={handleAddNew}
          disabled={loading}
          className='bg-gray-200 hover:bg-[#601E8D] hover:text-white text-black px-4 py-2 rounded-lg transition text-xs font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <Plus size={16} />
          Create Coupon
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500" size={20} />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className='mb-4 text-sm text-gray-600'>
        Active Coupons: {activeCount} / {MAX_ACTIVE_COUPONS}
      </div>

      {/* Table */}
      <div className='bg-white rounded-lg border border-[#E0DEE3] overflow-x-auto'>
        {!coupons.length ? (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">No coupons found</p>
            <p className="text-gray-500">Create your first coupon to get started.</p>
          </div>
        ) : (
          <table className='w-full text-sm'>
            <thead className='text-black border-b border-[#E0DEE3] bg-gray-50'>
              <tr>
                <th className='px-5 py-4 text-left font-medium'>Coupon</th>
                <th className='px-5 py-4 text-left font-medium'>Discount</th>
                <th className='px-5 py-4 text-left font-medium'>Minimum order value</th>
                <th className='px-5 py-4 text-left font-medium'>Usage</th>
                <th className='px-5 py-4 text-left font-medium'>Expiry date</th>
                <th className='px-5 py-4 text-left font-medium'>Status</th>
                <th className='pr-7 py-4 text-center font-medium'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {coupons.map((coupon) => (
                <tr
                  key={coupon.id}
                  className={
                    isExpired(coupon) && !coupon.is_permanent
                      ? 'bg-red-50'
                      : 'bg-white hover:bg-gray-50 transition-colors'
                  }
                >
                  <td className='px-5 py-4 font-medium text-gray-900'>
                    {coupon.code}
                  </td>
                  <td className='px-5 py-4 text-gray-700'>
                    {coupon.discount_percent}%
                  </td>
                  <td className='px-5 py-4 text-gray-700'>
                    ₹{coupon.min_order_amount}
                  </td>
                  <td className='px-5 py-4 text-gray-700'>
                    {coupon.usage_count || 0}
                  </td>
                  <td className='px-5 py-4 text-gray-700'>
                    {coupon.is_permanent ? (
                      <span className="text-green-600 font-medium">Permanent</span>
                    ) : (
                      formatDate(coupon.expiry_date)
                    )}
                  </td>
                  <td className='px-5 py-4'>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isExpired(coupon) && !coupon.is_permanent
                          ? 'bg-red-100 text-red-800'
                          : coupon.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {isExpired(coupon) && !coupon.is_permanent
                        ? 'Expired'
                        : coupon.is_active
                        ? 'Active'
                        : 'Inactive'
                      }
                    </span>
                  </td>
                  <td className='pr-7 py-4 flex justify-center'>
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      disabled={loading}
                      className="p-1 text-red-600 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50"
                      title="Delete coupon"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}