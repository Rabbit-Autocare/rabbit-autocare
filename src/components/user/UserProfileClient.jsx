'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import UserLayout from '@/components/layouts/UserLayout';
import '@/app/globals.css';

export default function UserProfileClient({ initialData }) {
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(initialData);
  const [originalData, setOriginalData] = useState(initialData);

  /**
   * Updates profile data in Supabase
   */
  const updateProfile = async () => {
    try {
      if (!initialData.id) return;

      setUpdating(true);
      const supabase = createSupabaseBrowserClient();

      // Update profile in auth_users table
      const { error } = await supabase
        .from('auth_users')
        .update({
          name: profileData.name,
          phone_number: profileData.phone_number,
          updated_at: new Date().toISOString(),
        })
        .eq('id', initialData.id);

      if (error) throw error;

      setOriginalData(profileData);
      setIsEditing(false);

      // Show success message with animation
      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
      successMsg.textContent = 'Profile updated successfully!';
      document.body.appendChild(successMsg);

      setTimeout(() => successMsg.classList.remove('translate-x-full'), 100);
      setTimeout(() => {
        successMsg.classList.add('translate-x-full');
        setTimeout(() => document.body.removeChild(successMsg), 300);
      }, 3000);

    } catch (error) {
      console.error('Error updating profile:', error);

      // Show error message
      const errorMsg = document.createElement('div');
      errorMsg.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
      errorMsg.textContent = 'Failed to update profile. Please try again.';
      document.body.appendChild(errorMsg);

      setTimeout(() => errorMsg.classList.remove('translate-x-full'), 100);
      setTimeout(() => {
        errorMsg.classList.add('translate-x-full');
        setTimeout(() => document.body.removeChild(errorMsg), 300);
      }, 3000);
    } finally {
      setUpdating(false);
    }
  };

  const cancelEdit = () => {
    setProfileData(originalData);
    setIsEditing(false);
  };

  const hasChanges = JSON.stringify(profileData) !== JSON.stringify(originalData);

  return (
    <UserLayout>
      <div className='min-h-screen py-6 px-4 sm:px-6 lg:px-8 mt-7'>
        <div className='max-w-4xl xl:max-w-[1240px] mx-auto'>
          {/* Header Section */}
          <div className='text-center mb-8'>
            <h1 className="flex items-center text-[20px] font-semibold tracking-wide border-l-7 border-l-[#601e8d] pl-2 text-black h-7">
              My Profile
            </h1>
          </div>

          {/* Profile Card */}
          <div className='bg-white/80 backdrop-blur-sm rounded-[4px] shadow-2xl border border-white/20 overflow-hidden xl:min-h-[650px]'>
            {/* Profile Header */}
            <div className='bg-[#601e8d] px-6 sm:px-8 py-8 sm:py-12'>
              <div className='flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8'>
                {/* Avatar */}
                <div className='relative group'>
                  <div className='w-24 h-24 sm:w-32 sm:h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-4 border-white/30 group-hover:border-white/50 transition-all duration-300'>
                    <svg className='w-12 h-12 sm:w-16 sm:h-16 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                    </svg>
                  </div>
                  <div className='absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform duration-200'>
                    <svg className='w-4 h-4 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' />
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 13a3 3 0 11-6 0 3 3 0 016 0z' />
                    </svg>
                  </div>
                </div>

                {/* User Info */}
                <div className='text-center sm:text-left flex-1'>
                  <h2 className='text-2xl sm:text-3xl font-bold text-white mb-2'>
                    {profileData.name || 'Your Name'}
                  </h2>
                  <p className='text-blue-100 text-lg mb-1'>{profileData.email}</p>
                  {profileData.phone_number && (
                    <p className='text-blue-100'>{profileData.phone_number}</p>
                  )}
                  <div className='mt-4 flex justify-center sm:justify-start'>
                    <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white backdrop-blur-sm'>
                      <span className='w-2 h-2 bg-green-400 rounded-full mr-2'></span>
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <div className='p-6 sm:p-8'>
              <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8'>
                <div>
                  <h3 className='text-2xl font-bold text-gray-800 mb-2'>Personal Information</h3>
                  <p className='text-gray-600'>Update your personal details and information</p>
                </div>
                <div className='mt-4 sm:mt-0 flex space-x-3'>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className='inline-flex items-center px-4 py-2 bg-[#601e8d] hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-[4px] transition-all duration-300 transform hover:scale-105 shadow-lg'
                    >
                      <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                      </svg>
                      Edit Profile
                    </button>
                  ) : (
                    <div className='flex space-x-3'>
                      <button
                        onClick={cancelEdit}
                        className='inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-all duration-300'
                      >
                        Cancel
                      </button>
                      <button
                        onClick={updateProfile}
                        disabled={updating || !hasChanges}
                        className='inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                      >
                        {updating ? (
                          <>
                            <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2'></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                            </svg>
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-10 space-y-0'>
                {/* Full Name */}
                <div className='lg:col-span-2'>
                  <label htmlFor='name' className='block text-sm font-semibold text-gray-700 mb-2'>
                    Full Name
                  </label>
                  <div className='relative'>
                    <input
                      type='text'
                      id='name'
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border-2 rounded-[4px] transition-all duration-300 ${
                        isEditing
                          ? 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 bg-white'
                          : 'border-gray-100 bg-gray-50 cursor-default'
                      } text-gray-800 font-medium`}
                      placeholder='Enter your full name'
                    />
                    <div className={`absolute right-3 top-3 transition-opacity duration-300 ${isEditing ? 'opacity-100' : 'opacity-30'}`}>
                      <svg className='w-5 h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor='phone' className='block text-sm font-semibold text-gray-700 mb-2'>
                    Phone Number
                  </label>
                  <div className='relative'>
                    <input
                      type='tel'
                      id='phone'
                      value={profileData.phone_number}
                      onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border-2 rounded-[4px] transition-all duration-300 ${
                        isEditing
                          ? 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 bg-white'
                          : 'border-gray-100 bg-gray-50 cursor-default'
                      } text-gray-800 font-medium`}
                      placeholder='Enter your phone number'
                    />
                    <div className={`absolute right-3 top-3 transition-opacity duration-300 ${isEditing ? 'opacity-100' : 'opacity-30'}`}>
                      <svg className='w-5 h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label htmlFor='email' className='block text-sm font-semibold text-gray-700 mb-2'>
                    Email Address
                  </label>
                  <div className='relative'>
                    <input
                      type='email'
                      id='email'
                      value={profileData.email}
                      disabled
                      className='w-full px-4 py-3 border-2 border-gray-100 bg-gray-50 rounded-[4px] text-gray-600 font-medium cursor-not-allowed'
                    />
                    <div className='absolute right-3 top-3 opacity-30'>
                      <svg className='w-5 h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
                      </svg>
                    </div>
                  </div>
                  <p className='mt-2 text-sm text-gray-500 flex items-center'>
                    <svg className='w-4 h-4 mr-2 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                    Email address cannot be changed for security reasons
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
