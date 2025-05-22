'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import UserLayout from '../../components/layouts/UserLayout';
import '../../app/globals.css';

export default function AddressBookPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    phone: '',
    is_default: false,
  });

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (userId) fetchAddresses();
  }, [userId]);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) setUserId(data.user.id);
  };

  const fetchAddresses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (!error) {
      setAddresses(data || []);
    } else {
      console.error('Error fetching addresses:', error);
    }
    setLoading(false);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // If this is set as default, unset any existing defaults
    if (formData.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);
    }

    if (editingId) {
      // Update existing address
      const { error } = await supabase
        .from('addresses')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);

      if (error) {
        alert('Failed to update address');
        console.error(error);
      } else {
        resetForm();
        fetchAddresses();
      }
    } else {
      // Add new address
      const { error } = await supabase.from('addresses').insert({
        ...formData,
        user_id: userId,
        created_at: new Date().toISOString(),
      });

      if (error) {
        alert('Failed to add address');
        console.error(error);
      } else {
        resetForm();
        fetchAddresses();
      }
    }

    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'India',
      phone: '',
      is_default: false,
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleEdit = (address) => {
    setFormData({
      name: address.name,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      phone: address.phone,
      is_default: address.is_default,
    });
    setEditingId(address.id);
    setShowAddForm(true);
  };

  const handleSetDefault = async (id) => {
    setLoading(true);

    // Unset all defaults
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId);

    // Set the new default
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);

    fetchAddresses();
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    setLoading(true);
    const { error } = await supabase.from('addresses').delete().eq('id', id);

    if (error) {
      alert('Failed to delete address');
      console.error(error);
    } else {
      fetchAddresses();
    }
    setLoading(false);
  };

  return (
    <UserLayout>
      <div className='pb-6'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-3xl font-bold'>Address Book</h1>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded'
            >
              Add New Address
            </button>
          )}
        </div>

        {showAddForm && (
          <div className='bg-white p-6 rounded-lg shadow-md mb-6'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-xl font-semibold'>
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button
                onClick={resetForm}
                className='text-gray-500 hover:text-gray-700'
              >
                &times; Cancel
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className='grid grid-cols-1 md:grid-cols-2 gap-4'
            >
              <div className='col-span-2'>
                <label className='block text-sm font-medium text-gray-700'>
                  Full Name
                </label>
                <input
                  type='text'
                  name='name'
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>

              <div className='col-span-2'>
                <label className='block text-sm font-medium text-gray-700'>
                  Address Line 1
                </label>
                <input
                  type='text'
                  name='address_line1'
                  value={formData.address_line1}
                  onChange={handleFormChange}
                  required
                  className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>

              <div className='col-span-2'>
                <label className='block text-sm font-medium text-gray-700'>
                  Address Line 2 (Optional)
                </label>
                <input
                  type='text'
                  name='address_line2'
                  value={formData.address_line2}
                  onChange={handleFormChange}
                  className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  City
                </label>
                <input
                  type='text'
                  name='city'
                  value={formData.city}
                  onChange={handleFormChange}
                  required
                  className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  State
                </label>
                <input
                  type='text'
                  name='state'
                  value={formData.state}
                  onChange={handleFormChange}
                  required
                  className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  Postal Code
                </label>
                <input
                  type='text'
                  name='postal_code'
                  value={formData.postal_code}
                  onChange={handleFormChange}
                  required
                  className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  Phone Number
                </label>
                <input
                  type='tel'
                  name='phone'
                  value={formData.phone}
                  onChange={handleFormChange}
                  required
                  className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>

              <div className='col-span-2'>
                <label className='flex items-center'>
                  <input
                    type='checkbox'
                    name='is_default'
                    checked={formData.is_default}
                    onChange={handleFormChange}
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <span className='ml-2 text-sm text-gray-700'>
                    Set as default address
                  </span>
                </label>
              </div>

              <div className='col-span-2 flex justify-end'>
                <button
                  type='submit'
                  disabled={loading}
                  className='bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                >
                  {loading
                    ? 'Saving...'
                    : editingId
                    ? 'Update Address'
                    : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading && !showAddForm ? (
          <div className='text-center py-12'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto'></div>
            <p className='mt-4'>Loading addresses...</p>
          </div>
        ) : addresses.length === 0 ? (
          <div className='bg-white p-8 text-center rounded-lg shadow-md'>
            <svg
              className='w-16 h-16 mx-auto text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
              />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
              />
            </svg>
            <p className='mt-4 text-lg'>No addresses saved yet.</p>
            <p className='text-gray-500 mt-2'>
              Add a new address to get started.
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-white p-5 rounded-lg shadow-md ${
                  address.is_default ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {address.is_default && (
                  <span className='bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mb-2 inline-block'>
                    Default
                  </span>
                )}

                <h3 className='font-medium text-lg'>{address.name}</h3>
                <p className='text-gray-600'>{address.address_line1}</p>
                {address.address_line2 && (
                  <p className='text-gray-600'>{address.address_line2}</p>
                )}
                <p className='text-gray-600'>
                  {address.city}, {address.state} {address.postal_code}
                </p>
                <p className='text-gray-600'>{address.country}</p>
                <p className='text-gray-600'>{address.phone}</p>

                <div className='mt-4 flex flex-wrap gap-2'>
                  <button
                    onClick={() => handleEdit(address)}
                    className='text-blue-600 hover:text-blue-800 text-sm font-medium'
                  >
                    Edit
                  </button>
                  {!address.is_default && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className='text-gray-600 hover:text-gray-800 text-sm font-medium'
                    >
                      Set as default
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(address.id)}
                    className='text-red-600 hover:text-red-800 text-sm font-medium'
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
