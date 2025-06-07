import React, { useState, useEffect } from 'react';

export default function AddressForm({ userId, onAddressAdded, onCancel, editingAddress, onAddressUpdated }) {
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
    if (editingAddress) {
      setFormData({
        name: editingAddress.name || '',
        address_line1: editingAddress.address_line1 || '',
        address_line2: editingAddress.address_line2 || '',
        city: editingAddress.city || '',
        state: editingAddress.state || '',
        postal_code: editingAddress.postal_code || '',
        country: editingAddress.country || 'India',
        phone: editingAddress.phone || '',
        is_default: editingAddress.is_default || false,
      });
    } else {
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
    }
  }, [editingAddress]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Add your form submission logic here to save to Supabase
    console.log('Submitting address form:', formData);
    // Example:
    // const { data, error } = await supabase.from('addresses').insert({...formData, user_id: userId});
    // Handle success/error and call onAddressAdded or onAddressUpdated

    if (editingAddress) {
       console.log('Simulating update address');
       if (onAddressUpdated) onAddressUpdated(formData); // Pass updated data if needed
     } else {
       console.log('Simulating create address');
       if (onAddressAdded) onAddressAdded(formData); // Pass new data if needed
     }

    // Close form after submission (adjust if using real API calls)
    // onCancel();
  };

  return (
    <div className="p-4 border rounded-lg bg-white mb-4">
      <h3 className="text-lg font-semibold mb-4">{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
          <input type="text" name="address_line1" value={formData.address_line1} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Address Line 2 (Optional)</label>
          <input type="text" name="address_line2" value={formData.address_line2} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input type="text" name="city" value={formData.city} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">State</label>
            <input type="text" name="state" value={formData.state} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Postal Code</label>
            <input type="text" name="postal_code" value={formData.postal_code} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
          </div>
        </div>
         <div>
          <label className="block text-sm font-medium text-gray-700">Country</label>
          <input type="text" name="country" value={formData.country} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
        </div>
        <div className="flex items-center">
          <input type="checkbox" name="is_default" checked={formData.is_default} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
          <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">Set as default address</label>
        </div>
        <div className="flex justify-end space-x-4">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{editingAddress ? 'Update Address' : 'Add Address'}</button>
        </div>
      </form>
    </div>
  );
}
