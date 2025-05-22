// File: src/pages/admin/coupons.js
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import AdminLayout from '@/components/layouts/AdminLayout';
import '../../../app/globals.css';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
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
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coupons:', error);
    } else {
      setCoupons(data || []);
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

    // Check if we've reached the maximum number of active coupons
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
      fetchCoupons();
    } catch (error) {
      alert(`Error: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (coupon) => {
    setFormMode('edit');
    setCurrentCoupon({
      ...coupon,
      expiry_date: coupon.expiry_date
        ? new Date(coupon.expiry_date).toISOString().split('T')[0]
        : '',
    });
  };

  const handleToggleActive = async (coupon) => {
    // If activating a coupon, check if we're at the limit
    if (!coupon.is_active && activeCount >= MAX_ACTIVE_COUPONS) {
      alert(
        `Maximum limit of ${MAX_ACTIVE_COUPONS} active coupons reached. Please delete expired coupons first.`
      );
      return;
    }

    const { error } = await supabase
      .from('coupons')
      .update({ is_active: !coupon.is_active })
      .eq('id', coupon.id);

    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      fetchCoupons();
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
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AdminLayout>
      <div className='p-6 max-w-6xl mx-auto'>
        <h1 className='text-2xl font-bold mb-6'>Coupon Management</h1>

        <div className='mb-8 bg-white p-6 rounded-lg shadow-md'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>
              {formMode === 'add' ? 'Create New Coupon' : 'Edit Coupon'}
            </h2>
            <div className='text-sm bg-blue-100 p-2 rounded'>
              <span className='font-medium'>Active Coupons:</span> {activeCount}
              /{MAX_ACTIVE_COUPONS}
            </div>
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
                  placeholder='e.g. SUMMER2025'
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

            <div className='flex gap-2'>
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

              {formMode === 'edit' && (
                <button
                  type='button'
                  onClick={resetForm}
                  className='bg-gray-300 px-4 py-2 rounded hover:bg-gray-400'
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className='bg-white p-6 rounded-lg shadow-md'>
          <h2 className='text-xl font-semibold mb-4'>All Coupons</h2>

          {loading && !coupons.length ? (
            <p className='text-center py-4'>Loading coupons...</p>
          ) : !coupons.length ? (
            <p className='text-center py-4'>No coupons found.</p>
          ) : (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-100'>
                  <tr>
                    <th className='px-4 py-2 text-left'>Code</th>
                    <th className='px-4 py-2 text-left'>Description</th>
                    <th className='px-4 py-2 text-left'>Discount</th>
                    <th className='px-4 py-2 text-left'>Min. Order</th>
                    <th className='px-4 py-2 text-left'>Expiry</th>
                    <th className='px-4 py-2 text-left'>Status</th>
                    <th className='px-4 py-2 text-left'>Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200'>
                  {coupons.map((coupon) => (
                    <tr
                      key={coupon.id}
                      className={isExpired(coupon) ? 'bg-red-50' : ''}
                    >
                      <td className='px-4 py-2 font-medium'>{coupon.code}</td>
                      <td className='px-4 py-2'>{coupon.description}</td>
                      <td className='px-4 py-2'>{coupon.discount_percent}%</td>
                      <td className='px-4 py-2'>₹{coupon.min_order_amount}</td>
                      <td className='px-4 py-2'>
                        {coupon.is_permanent ? (
                          <span className='text-green-600'>Permanent</span>
                        ) : (
                          <span
                            className={isExpired(coupon) ? 'text-red-600' : ''}
                          >
                            {formatDate(coupon.expiry_date)}
                          </span>
                        )}
                      </td>
                      <td className='px-4 py-2'>
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
                      <td className='px-4 py-2'>
                        <div className='flex space-x-2'>
                          <button
                            onClick={() => handleEdit(coupon)}
                            className='text-blue-600 hover:text-blue-800'
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleActive(coupon)}
                            className='text-yellow-600 hover:text-yellow-800'
                          >
                            {coupon.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(coupon.id)}
                            className='text-red-600 hover:text-red-800'
                          >
                            Delete
                          </button>
                        </div>
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
