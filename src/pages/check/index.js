import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import "../../app/globals.css"

export default function CheckPage() {
  const router = useRouter();
  const { id } = router.query;

  const [order, setOrder] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [shippingInfo, setShippingInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError || !orderData) {
      alert('Failed to load order');
      router.push('/');
      return;
    }

    setOrder(orderData);

    // Fetch user email
    const { data: userData } = await supabase
      .from('users') // adjust if your user table is named differently
      .select('email')
      .eq('id', orderData.user_id)
      .single();

    if (userData?.email) {
      setUserEmail(userData.email);
    }

    // Fetch full shipping address
    const { data: addressData } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', orderData.address_id)
      .single();

    setShippingInfo(addressData);
    setLoading(false);
  };

  const handleConfirm = async () => {
  try {
   await fetch('/api/send-confirmation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: userEmail,          // recipient
    email: userEmail,       // sender/user
    order,                  // your order object
    shipping: shippingInfo, // your shipping object
  }),
});

    router.push('/confirm');
  } catch (err) {
    console.error('Failed to send email:', err);
    router.push('/confirm');
  }
};

  if (loading) return <div className="p-6">Loading order...</div>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Confirm Your Order</h1>

      {/* User Email */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold text-lg mb-2">User Email</h2>
        <p>{userEmail || 'Email not found'}</p>
      </div>

      {/* Product Details */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold text-lg mb-2">Product Details</h2>
        {order.items.map((item, i) => (
          <div key={i} className="mb-2">
            <p><strong>{item.name}</strong></p>
            <p>Price: ₹{item.price}</p>
            <p>Quantity: {item.quantity}</p>
          </div>
        ))}
        <p className="font-semibold mt-2">Total: ₹{order.total}</p>
      </div>

      {/* Shipping Details */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold text-lg mb-2">Shipping Info</h2>
        {shippingInfo ? (
          <div>
            <p><strong>Name:</strong> {shippingInfo.full_name}</p>
            <p><strong>Phone:</strong> {shippingInfo.phone}</p>
            <p><strong>Address:</strong> {shippingInfo.street}, {shippingInfo.city}, {shippingInfo.state} - {shippingInfo.postal_code}</p>
            <p><strong>Type:</strong> {shippingInfo.address_type}</p>
          </div>
        ) : (
          <p>Shipping information not available.</p>
        )}
      </div>

      {/* Confirm Button */}
      <button
        onClick={handleConfirm}
        className="w-full bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
      >
        Confirm Order
      </button>
    </div>
  );
}
