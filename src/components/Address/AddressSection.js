'use client'
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AddressSection({ userId, selectedAddressId, setSelectedAddressId }) {
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState({
    full_name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    address_type: 'home',
  });
  const [addressLoading, setAddressLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (userId) fetchAddresses();
  }, [userId]);

  const fetchAddresses = async () => {
    setAddressLoading(true);
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setAddressLoading(false);
    setAddresses(data || []);
    if (data?.length > 0) {
      setSelectedAddressId(data[0].id);
    } else {
      setIsEditing(true);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectAddress = (address) => {
    setSelectedAddressId(address.id);
    setIsEditing(false);
  };

  const resetAddressForm = () => {
    setAddressForm({
      full_name: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      postal_code: '',
      address_type: 'home',
    });
  };

  const validateAddressForm = () => {
    const { full_name, phone, street, city, state, postal_code } = addressForm;
    if (!full_name || !phone || !street || !city || !state || !postal_code) {
      alert('Please fill all address fields');
      return false;
    }
    return true;
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!validateAddressForm()) return;

    setAddressLoading(true);
    try {
      let result;

      if (selectedAddressId && !isEditing) {
        // Update existing address
        const { data, error } = await supabase
          .from('addresses')
          .update({
            ...addressForm,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedAddressId)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new address
        const { data, error } = await supabase
          .from('addresses')
          .insert([{
            ...addressForm,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) throw error;
        result = data;
        setSelectedAddressId(result.id);
      }

      // Refresh addresses list
      await fetchAddresses();
      setIsEditing(false);

      // Show success message
      alert('Address saved successfully!');

    } catch (error) {
      console.error('Error saving address:', error);
      alert(`Error saving address: ${error.message}`);
    } finally {
      setAddressLoading(false);
    }
  };

  return (
    <div className='bg-white p-4 shadow rounded'>
      <h2 className='text-xl font-semibold mb-2'>Select Address</h2>
      {addressLoading ? (
        <p>Loading...</p>
      ) : (
        addresses.map((addr) => (
          <label
            key={addr.id}
            className={`block p-3 border rounded mb-2 cursor-pointer ${
              selectedAddressId === addr.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300'
            }`}
          >
            <input
              type='radio'
              name='address'
              checked={selectedAddressId === addr.id}
              onChange={() => handleSelectAddress(addr)}
              className='mr-2'
            />
            <span className='font-semibold'>{addr.full_name}</span>
            <div className='text-sm text-gray-600'>
              {addr.street}, {addr.city}, {addr.state} - {addr.postal_code}
            </div>
            <div className='text-xs text-gray-500'>
              {addr.phone} | {addr.address_type}
            </div>
          </label>
        ))
      )}

      <button
        onClick={() => {
          resetAddressForm();
          setIsEditing(true);
          setSelectedAddressId(null);
        }}
        className='text-blue-600 underline mb-2'
      >
        Add New Address
      </button>

      {isEditing && (
        <form onSubmit={handleAddressSubmit} className='space-y-2'>
          <input
            type='text'
            name='full_name'
            placeholder='Full Name'
            value={addressForm.full_name}
            onChange={handleInputChange}
            className='w-full border p-2 rounded'
          />
          <input
            type='tel'
            name='phone'
            placeholder='Phone'
            value={addressForm.phone}
            onChange={handleInputChange}
            className='w-full border p-2 rounded'
          />
          <input
            type='text'
            name='street'
            placeholder='Street'
            value={addressForm.street}
            onChange={handleInputChange}
            className='w-full border p-2 rounded'
          />
          <input
            type='text'
            name='city'
            placeholder='City'
            value={addressForm.city}
            onChange={handleInputChange}
            className='w-full border p-2 rounded'
          />
          <input
            type='text'
            name='state'
            placeholder='State'
            value={addressForm.state}
            onChange={handleInputChange}
            className='w-full border p-2 rounded'
          />
          <input
            type='text'
            name='postal_code'
            placeholder='Postal Code'
            value={addressForm.postal_code}
            onChange={handleInputChange}
            className='w-full border p-2 rounded'
          />
          <select
            name='address_type'
            value={addressForm.address_type}
            onChange={handleInputChange}
            className='w-full border p-2 rounded'
          >
            <option value='home'>Home</option>
            <option value='work'>Work</option>
            <option value='other'>Other</option>
          </select>
          <button
            type='submit'
            className='bg-blue-600 text-white py-2 px-4 rounded w-full'
          >
            {addressLoading ? 'Saving...' : 'Save Address'}
          </button>
        </form>
      )}
    </div>
  );
}
