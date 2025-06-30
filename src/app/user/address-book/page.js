'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import UserLayout from '@/components/layouts/UserLayout';
import { MapPin, Phone, Edit3, Trash2, Plus, Home, Briefcase, Star, Check, X, User, Building, MoreVertical } from 'lucide-react';
import '@/app/globals.css';
import { useAuth } from '@/hooks/useAuth';

export default function AddressBookPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null); // Moved to top level
  const { user, sessionChecked } = useAuth();
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

  useEffect(() => {
    // Only fetch addresses if we have confirmed the session state
    if (sessionChecked) {
      if (user) {
        fetchAddresses(user.id);
      } else {
        setLoading(false);
      }
    }
  }, [user, sessionChecked]);

  const fetchAddresses = async (userId) => {
    try {
    setLoading(true);
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
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

    // If setting as default, unset all other defaults first
    if (formData.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true);
    }

    const addressData = {
      full_name: formData.full_name,
      phone: formData.phone,
      street: formData.street,
      city: formData.city,
      state: formData.state,
      postal_code: formData.postal_code,
      address_type: formData.address_type,
      is_default: formData.is_default,
      user_id: user.id,
    };

    if (editingId) {
      const { error } = await supabase
        .from('addresses')
        .update(addressData)
        .eq('id', editingId);

      if (error) {
        alert('Failed to update address');
        console.error(error);
      } else {
        resetForm();
        fetchAddresses(user.id);
      }
    } else {
      const { error } = await supabase
        .from('addresses')
        .insert(addressData);

      if (error) {
        alert('Failed to add address');
        console.error(error);
      } else {
        resetForm();
        fetchAddresses(user.id);
      }
    }

    setLoading(false);
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

    // Unset all defaults first
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);

    // Set the new default
    const { error } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', id);

    if (error) {
      alert('Failed to set default address');
      console.error(error);
    } else {
      fetchAddresses(user.id);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    setLoading(true);
    const { error } = await supabase.from('addresses').delete().eq('id', id);

    if (error) {
      alert('Failed to delete address');
      console.error(error);
    } else {
      fetchAddresses(user.id);
    }
    setLoading(false);
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
      case 'home': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'work': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  // Dropdown functions moved to component level
  const toggleDropdown = (addressId) => {
    setActiveDropdown(activeDropdown === addressId ? null : addressId);
  };

  const closeDropdown = () => {
    setActiveDropdown(null);
  };

  // Show loading state while session is being checked
  if (!sessionChecked) {
    return (
      <UserLayout>
        <div className='p-6 flex items-center justify-center'>
          <div className='bg-white p-8 rounded-lg shadow-md'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto'></div>
            <p className='text-center mt-4'>Initializing...</p>
          </div>
        </div>
      </UserLayout>
    );
  }

  // Show loading state while fetching addresses
  if (loading) {
    return (
      <UserLayout>
        <div className='p-6 flex items-center justify-center'>
          <div className='bg-white p-8 rounded-lg shadow-md'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto'></div>
            <p className='text-center mt-4'>Loading addresses...</p>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0">
          <div>
            <h1 className="flex items-center text-[20px] font-semibold tracking-wide border-l-7 border-l-black pl-2 text-black h-7">
              Save Address
            </h1>

            {/* <p className="text-slate-600 mt-2 flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Manage your delivery addresses</span>
            </p> */}
          </div>

            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="group bg-black text-white px-6 py-3 rounded-[4px] font-medium shadow-lg shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                <span>Add New Address</span>
              </button>
            )}
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl shadow-slate-200/50 mb-8 border border-white/50">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center space-x-3">
                  {getAddressTypeIcon(formData.address_type)}
                  <span>{editingId ? 'Edit Address' : 'Add New Address'}</span>
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                >
                  <X className="w-6 h-6 text-gray-500 group-hover:text-gray-700" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Address Type Selection */}
                <div className="grid grid-cols-3 gap-4">
                  {['home', 'work', 'other'].map((type) => (
                    <label key={type} className={`cursor-pointer p-4 rounded-2xl border-2 transition-all duration-200 ${
                      formData.address_type === type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}>
                      <input
                        type="radio"
                        name="address_type"
                        value={type}
                        checked={formData.address_type === type}
                        onChange={handleFormChange}
                        className="sr-only"
                      />
                      <div className="flex flex-col items-center space-y-2">
                        {getAddressTypeIcon(type)}
                        <span className="font-medium capitalize text-sm">{type}</span>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Street Address
                    </label>
                    <textarea
                      name="street"
                      value={formData.street}
                      onChange={handleFormChange}
                      required
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter complete street address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter state"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                    <input
                      type="text"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter postal code"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                {/* Default Address Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleFormChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Set as default address
                  </label>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        <span>{editingId ? 'Update Address' : 'Save Address'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {addresses.length === 0 && !loading ? (
            <div className="bg-white/80 backdrop-blur-sm p-12 text-center rounded-3xl shadow-xl shadow-slate-200/50 border border-white/50">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No addresses yet</h3>
              <p className="text-gray-600 mb-6">Add your first address to get started with deliveries</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-medium shadow-lg shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
              >
                Add Your First Address
              </button>
            </div>
          ) : (
            /* Address Cards */
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className="bg-white border border-gray-200 rounded-[4px] p-0 hover:shadow-md transition-shadow duration-200 relative"
                >
                  {/* Header with Address Type and Actions */}
                  <div className="flex items-center justify-between p-6 pb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-medium text-gray-900 capitalize">
                        {address.address_type}
                      </span>
                      {address.is_default && (
                        <span className="text-sm text-orange-600 font-medium">
                          Default
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => toggleDropdown(address.id)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-500 cursor-pointer" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeDropdown === address.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={closeDropdown}
                          ></div>
                          <div
                            className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-[4px] shadow-lg overflow-hidden"
                            style={{ width: '113px', height: '75px' }}
                          >
                            <button
                              onClick={() => {
                                handleEdit(address);
                                closeDropdown();
                              }}
                              className="w-full h-1/2 px-4 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-200 flex items-center cursor-pointer"
                            >
                              Edit
                            </button>
                            {/* {!address.is_default && (
                              <button
                                onClick={() => {
                                  handleSetDefault(address.id);
                                  closeDropdown();
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                              >
                                Set Default
                              </button>
                            )} */}
                            <button
                              onClick={() => {
                                handleDelete(address.id);
                                closeDropdown();
                              }}
                              className="w-full h-1/2 px-4 text-left text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Full width border below heading */}
                  <div className="border-b border-gray-200"></div>

                  {/* Address Details */}
                  <div className="space-y-3 p-6 pt-4">
                    {/* Name */}
                    <div className="text-base tracking-wide font-medium text-gray-900">
                      {address.full_name}
                    </div>

                    {/* Address */}
                    <div className="text-sm tracking-wide text-gray-600 leading-relaxed">
                      {address.street}<br />
                      {address.city}, {address.state} {address.postal_code}
                    </div>

                    {/* Phone Number */}
                    <div className="text-sm tracking-wide text-gray-600">
                      <span className="font-medium text-black">Phone Number:</span> {address.phone}
                    </div>

                    {/* Email */}
                    {address.email && (
                      <div className="text-sm tracking-wide text-gray-600">
                        <span className="font-medium">Email:</span> {address.email}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
