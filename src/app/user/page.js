'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Image from 'next/image';
import UserLayout from '../../components/layouts/UserLayout';
import { useAuth } from '@/hooks/useAuth';
import '../../app/globals.css';

/**
 * User Profile Component
 * Allows users to view and edit their profile information and avatar
 */
export default function MyAccount() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone_number: '',
    email: '',
  });

  // Fetch user profile on component mount and when authUser changes
  useEffect(() => {
    if (authUser) {
      setProfileData({
        name: authUser.name || '',
        phone_number: authUser.phone_number || '',
        email: authUser.email || '',
      });
    }
  }, [authUser]);

  /**
   * Updates profile data in Supabase
   */
  const updateProfile = async () => {
    try {
      if (!authUser) return;

      setUpdating(true);

      // Update profile in auth_users table
      const { error } = await supabase
        .from('auth_users')
        .update({
          name: profileData.name,
          phone_number: profileData.phone_number,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authUser.id);

      if (error) throw error;

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading) {
    return (
      <UserLayout>
        <div className='text-center py-12'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto'></div>
          <p className='mt-4'>Loading your profile...</p>
        </div>
      </UserLayout>
    );
  }

  if (!authUser) {
    return (
      <UserLayout>
        <div className='text-center py-12'>
          <p className='text-xl text-gray-600'>Please log in to view your profile.</p>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <h1 className='text-3xl font-bold mb-6'>My Profile</h1>

      <div className='bg-white rounded-lg shadow-md p-8 max-w-3xl mx-auto'>
        <div className='space-y-6'>
          {/* Profile Information Form */}
          <div>
            <h2 className='text-xl font-semibold mb-4'>Personal Information</h2>
            <div className='space-y-4'>
              <div>
                <label htmlFor='name' className='block text-sm font-medium text-gray-700'>
                  Full Name
                </label>
                <input
                  type='text'
                  id='name'
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                />
              </div>

              <div>
                <label htmlFor='phone' className='block text-sm font-medium text-gray-700'>
                  Phone Number
                </label>
                <input
                  type='tel'
                  id='phone'
                  value={profileData.phone_number}
                  onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                  className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                />
              </div>

              <div>
                <label htmlFor='email' className='block text-sm font-medium text-gray-700'>
                  Email Address
                </label>
                <input
                  type='email'
                  id='email'
                  value={profileData.email}
                  disabled
                  className='mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm'
                />
                <p className='mt-1 text-sm text-gray-500'>Email cannot be changed</p>
              </div>
            </div>
          </div>

          {/* Update Button */}
          <div className='flex justify-end'>
            <button
              onClick={updateProfile}
              disabled={updating}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {updating ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
