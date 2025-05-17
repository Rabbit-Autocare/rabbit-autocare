'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import UserLayout from '../../components/layouts/UserLayout';
import '../../app/globals.css';
import Image from 'next/image';
import Link from 'next/link';

export default function MyAccount() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    email: '',
    avatar_url: null,
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

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
          email: user.email,
          phone: data.phone || '',
          avatar_url: data.avatar_url,
        });
      } else {
        setProfileData({
          ...profileData,
          email: user.email,
        });
      }
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value,
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      alert('Please upload a JPG or PNG image.');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async (userId) => {
    if (!avatarFile) return profileData.avatar_url;

    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('user-avatars')
      .upload(filePath, avatarFile, {
        upsert: true,
        contentType: avatarFile.type,
      });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('user-avatars').getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      // Upload avatar if changed
      let avatarUrl = profileData.avatar_url;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(user.id);
      }

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
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
              <form onSubmit={handleSubmit} className='space-y-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Full Name
                  </label>
                  <input
                    type='text'
                    name='name'
                    value={profileData.name}
                    onChange={handleChange}
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
                    onChange={handleChange}
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
