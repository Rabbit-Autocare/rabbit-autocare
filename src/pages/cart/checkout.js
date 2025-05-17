'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import "../../app/globals.css";
export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('id');
  const quantityParam = searchParams.get('qty');
  const quantity = parseInt(quantityParam, 10) || 1;

  const [product, setProduct] = useState(null);
  const [userId, setUserId] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newAddress, setNewAddress] = useState({
    full_name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    address_type: 'home', // default type
  });

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (productId) fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (userId) fetchAddresses();
  }, [userId]);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) setUserId(data.user.id);
  };

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (!error) setProduct(data);
  };

  const fetchAddresses = async () => {
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data?.length) {
      setAddresses(data);
      setSelectedAddressId(data[0].id); // auto select first address
    }
  };

  const handleAddressChange = (e) => {
    setNewAddress({ ...newAddress, [e.target.name]: e.target.value });
  };

  const handleNewAddressSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;

    const { data, error } = await supabase
      .from('addresses')
      .insert([
        {
          user_id: userId,
          ...newAddress,
        },
      ])
      .select()
      .single();

    if (error) {
      alert('Error saving address: ' + error.message);
    } else {
      setAddresses([data, ...addresses]);
      setSelectedAddressId(data.id);
      setShowAddressForm(false);
      setNewAddress({
        full_name: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        postal_code: '',
        address_type: 'home',
      });
    }
  };

  const handleDeleteAddress = async (id) => {
    await supabase.from('addresses').delete().eq('id', id);
    if (id === selectedAddressId) setSelectedAddressId(null);
    fetchAddresses();
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!userId || !product || !selectedAddressId) return;

    setLoading(true);

    const items = [
      {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity,
      },
    ];

    const totalPrice = product.price * quantity;

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          user_id: userId,
          items,
          total: totalPrice,
          address_id: selectedAddressId,
        },
      ])
      .select()
      .single();

    setLoading(false);

    if (error) {
      alert('Failed to place order: ' + error.message);
    } else {
      router.push(`/cart/check?id=${data.id}`);
    }
  };

  if (!product) return <div className="p-6">Loading product info...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-semibold text-lg">{product.name}</h2>
        <p>Price: ₹{product.price}</p>
        <p>Quantity: {quantity}</p>
        <p>Total: ₹{product.price * quantity}</p>
      </div>

      {/* Saved Addresses List */}
      <h3 className="text-lg font-semibold mb-2">Select Delivery Address</h3>
{addresses.length > 0 ? (
  <div className="grid gap-4">
    {addresses.map((addr) => (
      <label
        key={addr.id}
        className={`relative border rounded-lg p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 cursor-pointer transition ${
          selectedAddressId === addr.id
            ? 'border-green-600 bg-green-50'
            : 'border-gray-300 bg-white'
        }`}
      >
        <input
          type="radio"
          name="delivery_address"
          value={addr.id}
          checked={selectedAddressId === addr.id}
          onChange={() => setSelectedAddressId(addr.id)}
          className="absolute top-4 left-4 accent-green-600 w-5 h-5"
        />

        {/* Column 1 - User Details */}
        <div className="pl-8">
          <h4 className="font-semibold text-lg mb-1">Recipient Info</h4>
          <p><span className="font-medium">Name:</span> {addr.full_name}</p>
          <p><span className="font-medium">Phone:</span> {addr.phone}</p>
          <p>
            <span className="font-medium">Type:</span>{' '}
            <span className="capitalize inline-block px-2 py-0.5 rounded bg-gray-200 text-xs">
              {addr.address_type}
            </span>
          </p>
        </div>

        {/* Column 2 - Address Details */}
        <div>
          <h4 className="font-semibold text-lg mb-1">Address</h4>
          <p><span className="font-medium">Street:</span> {addr.street}</p>
          <p><span className="font-medium">City:</span> {addr.city}</p>
          <p><span className="font-medium">State:</span> {addr.state}</p>
          <p><span className="font-medium">Postal Code:</span> {addr.postal_code}</p>
        </div>

        {/* Delete Button */}
        <div className="sm:col-span-2 flex justify-end mt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteAddress(addr.id);
            }}
            className="text-sm px-4 py-1.5 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete Address
          </button>
        </div>
      </label>
    ))}
  </div>
) : (
  <p className="text-gray-600">No saved addresses found.</p>
)}


      <button
        onClick={() => setShowAddressForm(!showAddressForm)}
        className="mb-4 mt-2 text-blue-600 underline"
      >
        {showAddressForm ? 'Cancel' : 'Add New Address'}
      </button>

      {/* Add New Address Form */}
      {showAddressForm && (
        <form onSubmit={handleNewAddressSubmit} className="bg-gray-100 p-4 rounded mb-4 space-y-3">
          {[
            { name: 'full_name', label: 'Full Name' },
            { name: 'phone', label: 'Phone' },
            { name: 'street', label: 'Street Address' },
            { name: 'city', label: 'City' },
            { name: 'state', label: 'State' },
            { name: 'postal_code', label: 'Postal Code' },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="block text-sm font-medium">{label}</label>
              <input
                name={name}
                value={newAddress[name]}
                onChange={handleAddressChange}
                required
                className="w-full border px-3 py-2 rounded"
              />
            </div>
          ))}

          {/* Address Type Dropdown */}
          <div>
            <label className="block text-sm font-medium">Address Type</label>
            <select
              name="address_type"
              value={newAddress.address_type}
              onChange={handleAddressChange}
              required
              className="w-full border px-3 py-2 rounded"
            >
              <option value="home">Home</option>
              <option value="work">Work</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
            Save Address
          </button>
        </form>
      )}

      {/* Place Order Button */}
      <form onSubmit={handleSubmitOrder}>
        <button
          type="submit"
          disabled={loading || !selectedAddressId}
          className="w-full mt-4 bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
        >
          {loading ? 'Placing Order...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
}
