'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Image from 'next/image';
import UserLayout from '../../components/layouts/UserLayout';
import '../../app/globals.css';

/**
 * User Profile Component
 * Allows users to view and edit their profile information and avatar
 */
export default function MyAccount() {
  // User data states
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    email: '',
    avatar_url: null,
  });

  // Avatar management states
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  /**
   * Fetches user profile data from Supabase auth and users table
   */
  const fetchUserProfile = async () => {
    setLoading(true);

    // Get auth user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUser(user);

      // Get profile data from users table
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfileData({
          name: data.name || '',
          phone: data.phone || '',
          email: user.email || '',
          avatar_url: data.avatar_url || null,
        });
      } else {
        // If no profile exists, set email from auth
        setProfileData({
          name: '',
          phone: '',
          email: user.email || '',
          avatar_url: null,
        });
      }
    }

    setLoading(false);
  };

  /**
   * Handles avatar file selection
   *
   * @param {Event} e - File input change event
   */
  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);

      // Create preview URL for the selected file
      const preview = URL.createObjectURL(file);
      setAvatarPreview(preview);
    }
  };

  /**
   * Updates profile data in Supabase
   * Handles both profile info update and avatar upload
   */
  const updateProfile = async () => {
    try {
      if (!user) return;

      setUpdating(true);

      // Upload avatar if new one is selected
      let avatarUrl = profileData.avatar_url;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        avatarUrl = `https://your-supabase-url.supabase.co/storage/v1/object/public/profiles/${filePath}`;
      }

      // Check if user exists in the users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existingUser) {
        // Update profile in users table
        const { error } = await supabase
          .from('users')
          .update({
            name: profileData.name,
            phone: profileData.phone,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (error) throw error;
      } else {
        // Create new user record
        const { error } = await supabase.from('users').insert({
          id: user.id,
          name: profileData.name,
          email: user.email,
          phone: profileData.phone,
          avatar_url: avatarUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
      }

      alert('Profile updated successfully!');

      // Clean up preview URL
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }

      fetchUserProfile(); // Refresh profile data
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <UserLayout>
      <h1 className='text-3xl font-bold mb-6'>My Profile</h1>

      {loading ? (
        <div className='text-center py-12'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto'></div>
          <p className='mt-4'>Loading your profile...</p>
        </div>
      ) : (
        <div className='bg-white rounded-lg shadow-md p-8 max-w-3xl mx-auto'>
          <div className='flex flex-col md:flex-row gap-8 items-start'>
            {/* Profile Image Section */}
            <div className='w-full md:w-1/3 flex flex-col items-center'>
              <div className='relative mb-4'>
                {profileData.avatar_url || avatarPreview ? (
                  <div className='relative w-48 h-48 rounded-full overflow-hidden border-4 border-gray-200'>
                    <Image
                      src={avatarPreview || profileData.avatar_url}
                      alt='Profile'
                      fill
                      sizes='192px'
                      priority
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <div className='w-48 h-48 rounded-full bg-blue-100 flex items-center justify-center border-4 border-gray-200'>
                    <span className='text-6xl font-semibold text-blue-600'>
                      {profileData.name
                        ? profileData.name[0].toUpperCase()
                        : profileData.email
                        ? profileData.email[0].toUpperCase()
                        : '?'}
                    </span>
                  </div>
                )}
              </div>
              <label className='w-full max-w-xs cursor-pointer'>
                <input
                  type='file'
                  accept='image/jpeg, image/jpg, image/png'
                  onChange={handleAvatarChange}
                  className='hidden'
                />
                <div className='bg-blue-50 text-blue-700 text-center py-2 px-4 rounded-md font-medium text-sm hover:bg-blue-100 transition'>
                  {profileData.avatar_url
                    ? 'Change Profile Photo'
                    : 'Upload Profile Photo'}
                </div>
              </label>
            </div>

            {/* Profile Information Section */}
            <div className='w-full md:w-2/3'>
              <form onSubmit={updateProfile} className='space-y-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Full Name
                  </label>
                  <input
                    type='text'
                    name='name'
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                    className='block w-full border-gray-300 rounded-md shadow-sm p-3 border focus:ring-blue-500 focus:border-blue-500'
                    required
                    placeholder='Enter your full name'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Phone Number
                  </label>
                  <input
                    type='tel'
                    name='phone'
                    value={profileData.phone || ''}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                    className='block w-full border-gray-300 rounded-md shadow-sm p-3 border focus:ring-blue-500 focus:border-blue-500'
                    placeholder='Enter your phone number'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Email Address
                  </label>
                  <input
                    type='email'
                    name='email'
                    value={profileData.email || ''}
                    disabled
                    className='block w-full border-gray-300 rounded-md shadow-sm p-3 border bg-gray-50 text-gray-500'
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Email cannot be changed
                  </p>
                </div>

                <div className='flex justify-end pt-4'>
                  <button
                    type='submit'
                    disabled={updating}
                    className='bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50'
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
}
