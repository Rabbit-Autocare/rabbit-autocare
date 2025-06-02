'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import AdminLayout from '@/components/layouts/AdminLayout';
import CouponForm from '@/components/forms/CouponForm'; // <- IMPORT HERE
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
      .select(`*, user_coupons:user_coupons(count)`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coupons:', error);
    } else {
      const couponsWithUsage = data.map((coupon) => ({
        ...coupon,
        usage_count: coupon.user_coupons?.[0]?.count || 0,
      }));
      setCoupons(couponsWithUsage || []);
      const active = data.filter((coupon) => coupon.is_active).length;
      setActiveCount(active);
    }
    setLoading(false);
  };

  const handleSubmit = async (couponData) => {
    setLoading(true);
    try {
      if (formMode === 'add') {
        const { error } = await supabase.from('coupons').insert([
          {
            ...couponData,
            is_active: true,
          },
        ]);
        if (error) throw error;
        alert('Coupon created successfully!');
      } else {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', couponData.id);
        if (error) throw error;
        alert('Coupon updated successfully!');
      }
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
    if (window.confirm('Are you sure you want to delete this coupon?')) {
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

        {/* Coupon Form Modal */}
        <CouponForm
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          initialData={currentCoupon}
          formMode={formMode}
          isLoading={loading}
          maxActiveCoupons={MAX_ACTIVE_COUPONS}
          activeCount={activeCount}
        />

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
                      <td className='px-6 py-4 font-medium text-gray-900'>
                        {coupon.code}
                      </td>
                      <td className='px-6 py-4'>{coupon.discount_percent}%</td>
                      <td className='px-6 py-4'>₹{coupon.min_order_amount}</td>
                      <td className='px-6 py-4'>{coupon.usage_count || 0}</td>
                      <td className='px-6 py-4'>
                        {coupon.is_permanent ? (
                          <span className='text-green-600'>Permanent</span>
                        ) : (
                          formatDate(coupon.expiry_date)
                        )}
                      </td>
                      <td className='px-6 py-4'>
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
                      <td className='px-6 py-4'>
                        <Image
                          src='/assets/delete.svg'
                          alt='Delete'
                          width={18}
                          height={18}
                          onClick={() => handleDelete(coupon.id)}
                          className='cursor-pointer hover:text-red-600'
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
