'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import CouponForm from '@/components/forms/CouponForm';
import CouponTable from './CouponTable';
import '@/app/globals.css';
import { Plus, AlertCircle } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';

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
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    fetchCoupons();
    // eslint-disable-next-line
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
      const active = (data || []).filter((coupon) => coupon.is_active).length;
      setActiveCount(active);
    } catch (error) {
      setError(`Error fetching coupons: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (couponData) => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (formMode === 'add') {
        result = await supabase.from('coupons').insert([couponData]);
      } else {
        result = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', couponData.id);
      }
      if (result.error) throw result.error;
      alert(`Coupon ${formMode === 'add' ? 'created' : 'updated'} successfully!`);
      resetForm();
      setCurrentView('list');
      fetchCoupons();
    } catch (error) {
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
        const { error } = await supabase.from('coupons').delete().eq('id', id);
        if (error) throw error;
        alert('Coupon deleted successfully');
        fetchCoupons();
      } catch (error) {
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

  return (
    <AdminLayout>
      <div className='p-6 max-w-6xl mx-auto'>
        {currentView === 'list' ? (
          <CouponTable
            coupons={coupons}
            loading={loading}
            error={error}
            activeCount={activeCount}
            MAX_ACTIVE_COUPONS={MAX_ACTIVE_COUPONS}
            handleAddNew={handleAddNew}
            handleDelete={handleDelete}
            isExpired={isExpired}
            formatDate={formatDate}
          />
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
