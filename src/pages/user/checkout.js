// app/checkout/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
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
  const [shipping, setShipping] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) return;
    fetchProduct();
    getUser();
  }, [productId]);

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

  const handleChange = (e) => {
    setShipping({ ...shipping, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !product) return;

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
          shipping_info: shipping,
        },
      ])
      .select()
      .single();

    setLoading(false);

    if (error) {
      alert('Failed to place order: ' + error.message);
    } else {
      router.push(`/user/check?id=${data.id}`);
    }
  };

  if (!product) return <div className="p-6">Loading product info...</div>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-semibold text-lg">{product.name}</h2>
        <p>Price: ₹{product.price}</p>
        <p>Quantity: {quantity}</p>
        <p>Total: ₹{product.price * quantity}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {['name', 'address', 'city', 'state', 'postalCode', 'phone'].map((field) => (
          <div key={field}>
            <label className="block font-medium capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
            <input
              name={field}
              value={shipping[field]}
              onChange={handleChange}
              required
              className="w-full border px-3 py-2 rounded"
              type={field === 'phone' ? 'tel' : 'text'}
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
        >
          {loading ? 'Placing Order...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
}
