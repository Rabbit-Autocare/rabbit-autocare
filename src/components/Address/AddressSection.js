"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AddressCard from './AddressCard';
import AddressForm from './AddressForm';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function AddressSection({
  selectedAddress,
  setSelectedAddress,
}) {
  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addressToDeleteId, setAddressToDeleteId] = useState(null);

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (userId) fetchAddresses();
  }, [userId, fetchAddresses]);

  const fetchAddresses = useCallback(async () => {
    setAddressLoading(true);
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
      setAddressLoading(false);
      if (data?.length > 0) {
        setSelectedAddressId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setAddressLoading(false);
    }
  }, [userId, setSelectedAddressId]);

  useEffect(() => {
    const foundAddress = addresses.find(addr => addr.id === selectedAddressId);
    setSelectedAddress(foundAddress || null);
  }, [selectedAddressId, addresses, setSelectedAddress]);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) setUserId(data.user.id);
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
    setAddressLoading(true);

    if (formData.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);
    }

    if (editingId) {
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

    setAddressLoading(false);
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
    setAddressLoading(true);

    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId);

    await supabase.from('addresses').update({ is_default: true }).eq('id', id);

    fetchAddresses();
  };

  const handleDeleteClick = (id) => {
    setAddressToDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!addressToDeleteId) return;
    setAddressLoading(true);
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressToDeleteId);

      if (error) throw error;
      fetchAddresses();
      setShowDeleteModal(false);
      setAddressToDeleteId(null);
    } catch (error) {
      console.error('Error deleting address:', error);
      setShowDeleteModal(false);
      setAddressToDeleteId(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setAddressToDeleteId(null);
  };

  const handleSelectAddress = useCallback((address) => {
    setSelectedAddressId(address.id);
  }, [setSelectedAddressId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Shipping Address</h2>
        {!showAddForm && addresses.length > 0 && (
          <button
            onClick={() => setShowAddForm(true)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Add New
          </button>
        )}
      </div>

      {showAddForm || editingId ? (
        <AddressForm
          userId={userId}
          onAddressAdded={() => { setShowAddForm(false); fetchAddresses(); }}
          onCancel={() => { setShowAddForm(false); setEditingId(null); }}
          editingAddress={addresses.find(addr => addr.id === editingId)}
          onAddressUpdated={() => { setEditingId(null); fetchAddresses(); }}
        />
      ) : addressLoading ? (
        <p>Loading addresses...</p>
      ) : addresses.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600 mb-4">No addresses found. Please add one to proceed with checkout.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          >
            Add New Address
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              isSelected={address.id === selectedAddressId}
              onSelect={() => handleSelectAddress(address)}
              onEdit={() => setEditingId(address.id)}
              onDelete={() => handleDeleteClick(address.id)}
            />
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Confirm Delete Address"
        message="Are you sure you want to delete this address?"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
