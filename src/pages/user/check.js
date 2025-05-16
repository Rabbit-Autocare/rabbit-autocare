// pages/user/check.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import "../../app/globals.css"
export default function CheckPage() {
  const router = useRouter();
  const { id } = router.query;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      alert('Failed to load order');
      router.push('/');
    } else {
      setOrder(data);
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    router.push('/user/confirm');
  };

  if (loading) return <div className="p-6">Loading order...</div>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Confirm Your Order</h1>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold text-lg mb-2">Product</h2>
        {order.items.map((item, i) => (
          <div key={i}>
            <p><strong>{item.name}</strong></p>
            <p>Price: ₹{item.price}</p>
            <p>Quantity: {item.quantity}</p>
          </div>
        ))}
        <p className="font-semibold mt-2">Total: ₹{order.total}</p>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold text-lg mb-2">Shipping Info</h2>
        {Object.entries(order.shipping_info).map(([key, value]) => (
          <p key={key}>
            {key}: {value}
          </p>
        ))}
      </div>

      <button
        onClick={handleConfirm}
        className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
      >
        Confirm Order
      </button>
    </div>
  );
}
