'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import CouponForm from '@/components/forms/CouponForm';
import CouponTable from './CouponTable';
import '@/app/globals.css';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formMode, setFormMode] = useState('add');
  const [currentView, setCurrentView] = useState('list');
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

  // Fetch all coupons and handle expired ones
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

      const now = new Date();

      // Filter and delete expired coupons
      const expiredCoupons = (data || []).filter(
        (coupon) =>
          !coupon.is_permanent &&
          coupon.expiry_date &&
          new Date(coupon.expiry_date) < now
      );

      if (expiredCoupons.length > 0) {
        const expiredIds = expiredCoupons.map((c) => c.id);
        const { error: deleteError } = await supabase
          .from('coupons')
          .delete()
          .in('id', expiredIds);

        if (deleteError) throw deleteError;
      }

      // Keep only valid coupons
      const validCoupons = (data || []).filter(
        (coupon) =>
          coupon.is_permanent ||
          !coupon.expiry_date ||
          new Date(coupon.expiry_date) >= now
      );

      setCoupons(validCoupons);
      const active = validCoupons.filter((coupon) => coupon.is_active).length;
      setActiveCount(active);
    } catch (error) {
      setError(`Error fetching coupons: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to assign active coupons to a new user
  const assignActiveCouponsToNewUser = async (newUserId) => {
    try {
      // Fetch all active coupons
      const { data: activeCoupons, error } = await supabase
        .from('coupons')
        .select('id')
        .eq('is_active', true);  // Fetch active coupons only

      if (error) {
        throw new Error('Error fetching active coupons');
      }

      if (!activeCoupons || activeCoupons.length === 0) {
        console.log('No active coupons found');
        return;
      }

      // Add active coupon IDs to the new user's coupons field
      const couponIds = activeCoupons.map(coupon => coupon.id); // Extract only the coupon IDs
      console.log('Coupon IDs to Assign:', couponIds);

      // Update the user's coupons field with the active coupons
      const { error: updateError } = await supabase
        .from('auth_users')
        .update({ coupons: couponIds }) // Update with the list of active coupon IDs
        .eq('id', newUserId); // Ensure we're updating the right user

      if (updateError) {
        throw new Error('Error assigning coupons to new user');
      }

      console.log(`Assigned ${couponIds.length} active coupons to user ${newUserId}`);
    } catch (error) {
      console.error('Error assigning active coupons to new user:', error);
    }
  };

  // Handle form submission to create or update a coupon
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

  // Handle deletion of a coupon
  const handleDelete = async (id) => {
  if (window.confirm('Are you sure you want to delete this coupon?')) {
    setLoading(true);
    setError(null);
    
    try {
      // Call API instead of direct Supabase
      const response = await fetch(`/api/coupons?id=${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete coupon');
      }
      
      alert('Coupon deleted successfully');
      fetchCoupons();
    } catch (error) {
      setError(`Error: ${error.message}`);
      console.error('Delete error:', error);
    } finally {
      setLoading(false);
    }
  }
};


  // Remove coupon from all users when it is deleted
const removeDeletedCouponFromUsers = async (couponId) => {
  try {
    // Use the custom database function
    const { error } = await supabase.rpc('remove_coupon_from_users', {
      coupon_id_to_remove: couponId
    });

    if (error) {
      console.error('Error removing coupon from users:', error);
    } else {
      console.log(`Successfully removed coupon ${couponId} from all users`);
    }
  } catch (error) {
    console.error('Error removing deleted coupon from users:', error);
  }
};


  // Handle form reset
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

  // Check if coupon is expired
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
