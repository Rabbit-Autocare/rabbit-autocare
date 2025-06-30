'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import CouponForm from '@/components/forms/CouponForm';
import '@/app/globals.css';
import { Plus, AlertCircle, Trash2, Gift } from 'lucide-react';
import Image from 'next/image';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'form'
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
    setError(null);
    try {
      const response = await fetch('/api/coupons', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch coupons');
      }

      if (result.success) {
        setCoupons(result.coupons || []);
        const active = result.coupons.filter((coupon) => coupon.is_active).length;
        setActiveCount(active);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setError(`Error fetching coupons: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (couponData) => {
    setLoading(true);
    setError(null);
    try {
      const url = '/api/coupons';
      const method = formMode === 'add' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify(couponData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${formMode} coupon`);
      }

      if (result.success) {
        alert(`Coupon ${formMode === 'add' ? 'created' : 'updated'} successfully!`);
        resetForm();
        setCurrentView('list');
        fetchCoupons();
      }
    } catch (error) {
      console.error(`Error ${formMode}ing coupon:`, error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/coupons?id=${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to delete coupon');
        }

        if (result.success) {
          alert('Coupon deleted successfully');
          fetchCoupons();
        }
      } catch (error) {
        console.error('Error deleting coupon:', error);
        setError(`Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddNew = () => {
    resetForm();
    setCurrentView('form');
  };

  const handleCancel = () => {
    setCurrentView('list');
    setError(null);
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

  // if (loading && currentView === 'list') {
  //   return (
  //     <AdminLayout>
  //       <div className='p-6 max-w-6xl mx-auto'>
  //         <div className="flex items-center justify-center h-64">
  //           <div className="text-center">
  //             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
  //             <p className="text-gray-600">Loading coupons...</p>
  //           </div>
  //         </div>
  //       </div>
  //     </AdminLayout>
  //   );
  // }

  return (
    <AdminLayout>
      <div className='p-6 max-w-6xl mx-auto'>
        {currentView === 'list' ? (
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
                      <th className='px-5 py-4 text-left font-medium'>
                        Coupon
                      </th>
                      <th className='px-5 py-4 text-left font-medium'>
                        Discount
                      </th>
                      <th className='px-5 py-4 text-left font-medium'>
                        Minimum order value
                      </th>
                      <th className='px-5 py-4 text-left font-medium'>Usage</th>
                      <th className='px-5 py-4 text-left font-medium'>
                        Expiry date
                      </th>
                      <th className='px-5 py-4 text-left font-medium'>
                        Status
                      </th>
                      <th className='pr-7 py-4 text-center font-medium'>
                        Actions
                      </th>
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
        ) : (
          <CouponForm
            onClose={handleCancel}
            onSubmit={handleSubmit}
            initialData={currentCoupon}
            formMode={formMode}
            isLoading={loading}
            maxActiveCoupons={MAX_ACTIVE_COUPONS}
            activeCount={activeCount}
          />
        )}
      </div>
    </AdminLayout>
  );
}
