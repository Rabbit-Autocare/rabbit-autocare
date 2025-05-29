// File: src/pages/admin/coupons.js
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import AdminLayout from '@/components/layouts/AdminLayout';
import '../../../app/globals.css';
import { X } from 'lucide-react';
import Image from 'next/image';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [showModal, setShowModal] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState({
    code: '',
    description: '',
    discount_percent: '',
    min_order_amount: '',
    is_permanent: false,
    expiry_date: '',
  });
  const [activeCount, setActiveCount] = useState(0);
  const MAX_ACTIVE_COUPONS = 15;

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('coupons')
      .select(
        `
        *,
        user_coupons:user_coupons(count)
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coupons:', error);
    } else {
      const couponsWithUsage = data.map((coupon) => ({
        ...coupon,
        usage_count: coupon.user_coupons?.length || 0,
      }));

      setCoupons(couponsWithUsage || []);
      const active = data.filter((coupon) => coupon.is_active).length;
      setActiveCount(active);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setCurrentCoupon({
      ...currentCoupon,
      [e.target.name]: value,
    });
  };

  const validateForm = () => {
    const { code, discount_percent, min_order_amount } = currentCoupon;

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
      !currentCoupon.is_permanent &&
      (!currentCoupon.expiry_date ||
        new Date(currentCoupon.expiry_date) < new Date())
    ) {
      alert(
        'Please enter a valid future expiry date for non-permanent coupons'
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (formMode === 'add' && activeCount >= MAX_ACTIVE_COUPONS) {
      alert(
        `Maximum limit of ${MAX_ACTIVE_COUPONS} active coupons reached. Please delete expired coupons first.`
      );
      return;
    }

    setLoading(true);

    try {
      if (formMode === 'add') {
        const { error } = await supabase.from('coupons').insert([
          {
            code: currentCoupon.code.toUpperCase(),
            description: currentCoupon.description,
            discount_percent: parseInt(currentCoupon.discount_percent),
            min_order_amount: parseInt(currentCoupon.min_order_amount),
            is_permanent: currentCoupon.is_permanent,
            expiry_date: currentCoupon.is_permanent
              ? null
              : currentCoupon.expiry_date,
            is_active: true,
          },
        ]);

        if (error) throw error;
        alert('Coupon created successfully!');
      } else {
        const { error } = await supabase
          .from('coupons')
          .update({
            code: currentCoupon.code.toUpperCase(),
            description: currentCoupon.description,
            discount_percent: parseInt(currentCoupon.discount_percent),
            min_order_amount: parseInt(currentCoupon.min_order_amount),
            is_permanent: currentCoupon.is_permanent,
            expiry_date: currentCoupon.is_permanent
              ? null
              : currentCoupon.expiry_date,
          })
          .eq('id', currentCoupon.id);

        if (error) throw error;
        alert('Coupon updated successfully!');
      }

      // Reset form and refresh data
      resetForm();
      setShowModal(false);
      fetchCoupons();
    } catch (error) {
      alert(`Error: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        'Are you sure you want to delete this coupon? This will remove it for all users.'
      )
    ) {
      const { error } = await supabase.from('coupons').delete().eq('id', id);

      if (error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('Coupon deleted successfully');
        fetchCoupons();
      }
    }
  };

  const resetForm = () => {
    setFormMode('add');
    setCurrentCoupon({
      code: '',
      description: '',
      discount_percent: '',
      min_order_amount: '',
      is_permanent: false,
      expiry_date: '',
    });
  };

  const isExpired = (coupon) => {
    if (coupon.is_permanent) return false;
    return new Date(coupon.expiry_date) < new Date();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  };

  return (
    <AdminLayout>
      <div className='p-6 max-w-6xl mx-auto'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-2xl font-bold'>Coupons</h1>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className='bg-white border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 text-sm'
          >
            Create coupon
          </button>
        </div>

        {/* Modal for adding/editing coupons */}
        {showModal && (
          <div className='fixed inset-0 bg-gray-500/30 flex justify-center items-center z-50'>
            <div className='bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto'>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-xl font-semibold'>
                  {formMode === 'add' ? 'Create Coupon' : 'Edit Coupon'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className='text-gray-500 hover:text-gray-700'
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium mb-1'>
                      Coupon Code
                    </label>
                    <input
                      type='text'
                      name='code'
                      value={currentCoupon.code}
                      onChange={handleInputChange}
                      className='w-full p-2 border rounded'
                      placeholder='e.g. SUMMER25'
                      maxLength={20}
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium mb-1'>
                      Discount (%)
                    </label>
                    <input
                      type='number'
                      name='discount_percent'
                      value={currentCoupon.discount_percent}
                      onChange={handleInputChange}
                      className='w-full p-2 border rounded'
                      placeholder='e.g. 10'
                      min='1'
                      max='100'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium mb-1'>
                      Min. Order Amount (₹)
                    </label>
                    <input
                      type='number'
                      name='min_order_amount'
                      value={currentCoupon.min_order_amount}
                      onChange={handleInputChange}
                      className='w-full p-2 border rounded'
                      placeholder='e.g. 999'
                      min='0'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium mb-1'>
                      Expiry Date
                    </label>
                    <input
                      type='date'
                      name='expiry_date'
                      value={currentCoupon.expiry_date}
                      onChange={handleInputChange}
                      className='w-full p-2 border rounded'
                      disabled={currentCoupon.is_permanent}
                    />
                  </div>

                  <div className='md:col-span-2'>
                    <label className='block text-sm font-medium mb-1'>
                      Description
                    </label>
                    <input
                      type='text'
                      name='description'
                      value={currentCoupon.description}
                      onChange={handleInputChange}
                      className='w-full p-2 border rounded'
                      placeholder='e.g. 10% off on orders above ₹999'
                    />
                  </div>

                  <div className='md:col-span-2'>
                    <label className='flex items-center'>
                      <input
                        type='checkbox'
                        name='is_permanent'
                        checked={currentCoupon.is_permanent}
                        onChange={handleInputChange}
                        className='mr-2'
                      />
                      <span>Permanent Coupon (Never Expires)</span>
                    </label>
                  </div>
                </div>

                <div className='flex gap-2 pt-4 border-t'>
                  <button
                    type='submit'
                    className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
                    disabled={loading}
                  >
                    {loading
                      ? 'Saving...'
                      : formMode === 'add'
                      ? 'Create Coupon'
                      : 'Update Coupon'}
                  </button>
                  <button
                    type='button'
                    onClick={() => setShowModal(false)}
                    className='bg-gray-300 px-4 py-2 rounded hover:bg-gray-400'
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className='bg-white shadow rounded-md overflow-hidden'>
          {loading && !coupons.length ? (
            <p className='text-center py-4'>Loading coupons...</p>
          ) : !coupons.length ? (
            <p className='text-center py-4'>No coupons found.</p>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50 border-b'>
                  <tr className='text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <th className='px-6 py-3'>Coupon</th>
                    <th className='px-6 py-3'>Discount</th>
                    <th className='px-6 py-3'>Minimum order value</th>
                    <th className='px-6 py-3'>Usage</th>
                    <th className='px-6 py-3'>Expiry date</th>
                    <th className='px-6 py-3'>Status</th>
                    <th className='px-6 py-3'>Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200 bg-white'>
                  {coupons.map((coupon) => (
                    <tr
                      key={coupon.id}
                      className={
                        isExpired(coupon) && !coupon.is_permanent
                          ? 'bg-red-50'
                          : ''
                      }
                    >
                      <td className='px-6 py-4 whitespace-nowrap font-medium text-gray-900'>
                        {coupon.code}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        {coupon.discount_percent}%
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        ₹{coupon.min_order_amount}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        {coupon.usage_count || 0}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        {coupon.is_permanent ? (
                          <span className='text-green-600'>Permanent</span>
                        ) : (
                          formatDate(coupon.expiry_date)
                        )}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            coupon.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {coupon.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <Image
                          src='/assets/delete.svg'
                          alt='Delete'
                          width={18}
                          height={18}
                          onClick={() => handleDelete(coupon.id)}
                          className='text-gray-500 hover:text-red-600'
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
