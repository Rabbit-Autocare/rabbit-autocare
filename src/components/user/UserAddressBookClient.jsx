'use client';

import { useState } from 'react';
import UserLayout from '@/components/layouts/UserLayout';
import { MapPin, Phone, Edit3, Trash2, Plus, Home, Briefcase, Star, Check, X, User, Building, MoreVertical } from 'lucide-react';
import '@/app/globals.css';

async function fetchAddresses(userId) {
  const res = await fetch(`/api/user/addresses?userId=${userId}`);
  if (!res.ok) throw new Error('Failed to fetch addresses');
  return await res.json();
}
 
async function createAddress(userId, address) {
  const res = await fetch('/api/user/addresses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, address }),
  });
  if (!res.ok) throw new Error('Failed to create address');
  return await res.json();
}

async function updateAddress(addressId, updateData) {
  const res = await fetch('/api/user/addresses', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ addressId, updateData }),
  });
  if (!res.ok) throw new Error('Failed to update address');
  return await res.json();
}

async function deleteAddress(addressId) {
  const res = await fetch(`/api/user/addresses?addressId=${addressId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete address');
  return await res.json();
}

export default function UserAddressBookClient({ initialAddresses, userId }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    address_type: 'home',
    is_default: false,
  });

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const refreshAddresses = async () => {
    setLoading(true);
    try {
      const data = await fetchAddresses(userId);
      setAddresses(data || []);
    } catch (error) {
      alert('Failed to fetch addresses.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updateAddress(editingId, formData);
      } else {
        await createAddress(userId, formData);
      }
      await refreshAddresses();
      resetForm();
    } catch (error) {
      alert('Failed to save address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      postal_code: '',
      address_type: 'home',
      is_default: false,
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleEdit = (address) => {
    setFormData({
      full_name: address.full_name,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      address_type: address.address_type,
      is_default: address.is_default || false,
    });
    setEditingId(address.id);
    setShowAddForm(true);
  };

  const handleSetDefault = async (id) => {
    setLoading(true);
    try {
      // Set is_default true for this address, false for others
      await updateAddress(id, { is_default: true });
      await refreshAddresses();
    } catch (error) {
      alert('Failed to set default address.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    setLoading(true);
    try {
      await deleteAddress(id);
      await refreshAddresses();
    } catch (error) {
      alert('Failed to delete address.');
    } finally {
      setLoading(false);
    }
  }; 

  const getAddressTypeIcon = (type) => {
    switch (type) {
      case 'home': return <Home className="w-5 h-5" />;
      case 'work': return <Briefcase className="w-5 h-5" />;
      default: return <Building className="w-5 h-5" />;
    }
  };

  const getAddressTypeColor = (type) => {
    switch (type) {
      case 'home': return 'bg-blue-100 text-blue-800';
      case 'work': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleDropdown = (addressId) => {
    setActiveDropdown(activeDropdown === addressId ? null : addressId);
  };

  const closeDropdown = () => {
    setActiveDropdown(null);
  };

  return (
    <UserLayout>
      <div className='p-4 space-y-6'>
        <div className='flex justify-between items-center'>
          <h1 className='text-2xl font-bold'>Address Book</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className='bg-[#601e8d] hover:bg-[#4a1a6f] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors'
          >
            <Plus className="w-4 h-4" />
            Add Address
          </button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className='bg-white rounded-lg shadow border p-6'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-xl font-semibold'>
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button
                onClick={resetForm}
                className='text-gray-500 hover:text-gray-700'
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Full Name
                  </label>
                  <input
                    type='text'
                    name='full_name'
                    value={formData.full_name}
                    onChange={handleFormChange}
                    required
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#601e8d]'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Phone Number
                  </label>
                  <input
                    type='tel'
                    name='phone'
                    value={formData.phone}
                    onChange={handleFormChange}
                    required
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#601e8d]'
                  />
                </div>

                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Street Address
                  </label>
                  <input
                    type='text'
                    name='street'
                    value={formData.street}
                    onChange={handleFormChange}
                    required
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#601e8d]'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    City
                  </label>
                  <input
                    type='text'
                    name='city'
                    value={formData.city}
                    onChange={handleFormChange}
                    required
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#601e8d]'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    State
                  </label>
                  <input
                    type='text'
                    name='state'
                    value={formData.state}
                    onChange={handleFormChange}
                    required
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#601e8d]'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Postal Code
                  </label>
                  <input
                    type='text'
                    name='postal_code'
                    value={formData.postal_code}
                    onChange={handleFormChange}
                    required
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#601e8d]'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Address Type
                  </label>
                  <select
                    name='address_type'
                    value={formData.address_type}
                    onChange={handleFormChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#601e8d]'
                  >
                    <option value='home'>Home</option>
                    <option value='work'>Work</option>
                    <option value='other'>Other</option>
                  </select>
                </div>
              </div>

              <div className='flex items-center'>
                <input
                  type='checkbox'
                  name='is_default'
                  checked={formData.is_default}
                  onChange={handleFormChange}
                  className='h-4 w-4 text-[#601e8d] focus:ring-[#601e8d] border-gray-300 rounded'
                />
                <label className='ml-2 block text-sm text-gray-900'>
                  Set as default address
                </label>
              </div>

              <div className='flex justify-end space-x-3'>
                <button
                  type='button'
                  onClick={resetForm}
                  className='px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={loading}
                  className='px-4 py-2 bg-[#601e8d] text-white rounded-md hover:bg-[#4a1a6f] transition-colors disabled:opacity-50'
                >
                  {loading ? 'Saving...' : (editingId ? 'Update Address' : 'Add Address')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <div className='bg-white rounded-lg shadow border p-8 text-center'>
            <MapPin className="mx-auto mb-4 w-16 h-16 text-gray-300" />
            <h3 className='text-xl font-medium text-gray-600 mb-2'>No Addresses Yet</h3>
            <p className='text-gray-500 mb-6'>Add your first address to get started with faster checkout.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className='bg-[#601e8d] hover:bg-[#4a1a6f] text-white px-6 py-3 rounded-lg font-medium transition-colors'
            >
              Add Your First Address
            </button>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {addresses.map((address) => (
              <div
                key={address.id}
                className='bg-white rounded-lg shadow border p-4 relative'
              >
                <div className='flex justify-between items-start mb-3'>
                  <div className='flex items-center gap-2'>
                    {getAddressTypeIcon(address.address_type)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAddressTypeColor(address.address_type)}`}>
                      {address.address_type}
                    </span>
                    {address.is_default && (
                      <span className='px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1'>
                        <Star className="w-3 h-3" />
                        Default
                      </span>
                    )}
                  </div>

                  <div className='relative'>
                    <button
                      onClick={() => toggleDropdown(address.id)}
                      className='p-1 hover:bg-gray-100 rounded'
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>

                    {activeDropdown === address.id && (
                      <div className='absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-10 min-w-[120px]'>
                        <button
                          onClick={() => handleEdit(address)}
                          className='w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2'
                        >
                          <Edit3 className="w-4 h-4" />
                          Edit
                        </button>
                        {!address.is_default && (
                          <button
                            onClick={() => handleSetDefault(address.id)}
                            className='w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2'
                          >
                            <Star className="w-4 h-4" />
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(address.id)}
                          className='w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2'
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className='space-y-2'>
                  <div className='flex items-start gap-2'>
                    <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className='font-medium'>{address.full_name}</span>
                  </div>
                  <div className='flex items-start gap-2'>
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className='text-gray-600'>{address.phone}</span>
                  </div>
                  <div className='flex items-start gap-2'>
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className='text-gray-600'>
                      <p>{address.street}</p>
                      <p>{address.city}, {address.state} {address.postal_code}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Overlay to close dropdown when clicking outside */}
        {activeDropdown && (
          <div
            className='fixed inset-0 z-0'
            onClick={closeDropdown}
          />
        )}
      </div>
    </UserLayout>
  );
}
