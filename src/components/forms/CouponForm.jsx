'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function CouponForm({
  onClose,
  onSubmit,
  initialData = {
    code: '',
    description: '',
    discount_percent: '',
    min_order_amount: '',
    is_permanent: false,
    expiry_date: '',
  },
  formMode = 'add',
  isLoading = false,
  maxActiveCoupons = 15,
  activeCount = 0,
}) {
  const [couponData, setCouponData] = useState(initialData);

  // Update form when initialData changes (for editing)
  useEffect(() => {
    setCouponData(initialData);
  }, [initialData]);

  const handleInputChange = (e) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setCouponData({
      ...couponData,
      [e.target.name]: value,
    });
  };

  const validateForm = () => {
    const { code, discount_percent, min_order_amount, expiry_date } = couponData;

    if (!code || code.trim() === '') {
      alert('Please enter a coupon code');
      return false;
    }

    if (
      !discount_percent ||
      isNaN(discount_percent) ||
      discount_percent <= 0 ||
      discount_percent > 100
    ) {
      alert('Please enter a valid discount percentage (1-100)');
      return false;
    }

    if (!min_order_amount || isNaN(min_order_amount) || min_order_amount < 0) {
      alert('Please enter a valid minimum order amount');
      return false;
    }

    if (
      !couponData.is_permanent &&
      (!expiry_date || new Date(expiry_date) < new Date())
    ) {
      alert(
        'Please enter a valid future expiry date for non-permanent coupons'
      );
      return false;
    }

    // Check max active coupons limit
    if (formMode === 'add' && activeCount >= maxActiveCoupons) {
      alert(
        `Maximum limit of ${maxActiveCoupons} active coupons reached. Please delete expired coupons first.`
      );
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSubmit({
      ...couponData,
      code: couponData.code.toUpperCase(),
      discount_percent: parseInt(couponData.discount_percent),
      min_order_amount: parseInt(couponData.min_order_amount),
      expiry_date: couponData.is_permanent ? null : couponData.expiry_date,
    });
  };

  return (
    <div className='w-full bg-white text-gray-900'>
      {/* Header */}
      <div className='px-6'>
        <button
          onClick={onClose}
          className='flex items-center text-gray-600 hover:text-gray-900 mb-4 text-sm'
        >
          <ArrowLeft size={18} className='mr-2' />
          <span>Coupons</span>
        </button>
      </div>

      <div className='w-full mx-auto p-6'>
        <h2 className='text-2xl font-semibold mb-6'>
          {formMode === 'add' ? 'Create Coupon' : 'Edit Coupon'}
        </h2>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-base font-medium text-gray-900 mb-2'>
                Coupon Code
              </label>
              <input
                type='text'
                name='code'
                value={couponData.code}
                onChange={handleInputChange}
                className='w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black'
                placeholder='e.g. SUMMER25'
                maxLength={20}
              />
            </div>

            <div>
              <label className='block text-base font-medium text-gray-900 mb-2'>
                Discount (%)
              </label>
              <input
                type='number'
                name='discount_percent'
                value={couponData.discount_percent}
                onChange={handleInputChange}
                className='w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black'
                placeholder='e.g. 10'
                min='1'
                max='100'
              />
            </div>

            <div>
              <label className='block text-base font-medium text-gray-900 mb-2'>
                Min. Order Amount (₹)
              </label>
              <input
                type='number'
                name='min_order_amount'
                value={couponData.min_order_amount}
                onChange={handleInputChange}
                className='w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black'
                placeholder='e.g. 999'
                min='0'
              />
            </div>

            <div>
              <label className='block text-base font-medium text-gray-900 mb-2'>
                Expiry Date
              </label>
              <input
                type='date'
                name='expiry_date'
                value={couponData.expiry_date}
                onChange={handleInputChange}
                className='w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black'
                disabled={couponData.is_permanent}
              />
            </div>

            <div className='md:col-span-2'>
              <label className='block text-base font-medium text-gray-900 mb-2'>
                Description
              </label>
              <input
                type='text'
                name='description'
                value={couponData.description}
                onChange={handleInputChange}
                className='w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black'
                placeholder='e.g. 10% off on orders above ₹999'
              />
            </div>

            <div className='md:col-span-2'>
              <label className='flex items-center'>
                <input
                  type='checkbox'
                  name='is_permanent'
                  checked={couponData.is_permanent}
                  onChange={handleInputChange}
                  className='mr-2'
                />
                <span className='text-base'>
                  Permanent Coupon (Never Expires)
                </span>
              </label>
            </div>
          </div>

          <div className='pt-4 flex justify-end'>
            <button
              type='submit'
              className='bg-black text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-[#601E8D] disabled:opacity-50 disabled:cursor-not-allowed'
              disabled={isLoading}
            >
              {isLoading
                ? 'Saving...'
                : formMode === 'add'
                ? 'Create Coupon'
                : 'Update Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
