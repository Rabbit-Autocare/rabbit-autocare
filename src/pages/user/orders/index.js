'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import UserSidebar from '../../../components/UserSidebar';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (userId) fetchOrders();
  }, [userId]);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) setUserId(data.user.id);
  };

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error) setOrders(data);
    setLoading(false);
  };

  if (loading) return <div className="p-6">Loading orders...</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <UserSidebar />

      <main className="flex-1 ml-0 md:ml-60 p-6">
        <h1 className="text-3xl font-bold mb-6">Order History</h1>

        {orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white shadow p-4 rounded flex items-center justify-between"
              >
                <div>
                  <p>
                    <strong>Order ID:</strong> {order.id}
                  </p>
                  <p>
                    <strong>Date:</strong>{' '}
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                  <p>
                    <strong>Total:</strong> ₹{order.total_price}
                  </p>
                  <p>
                    <strong>Status:</strong> {order.status || 'Completed'}
                  </p>
                </div>

                <button
                  onClick={() => alert('Invoice download/view will be added soon')}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  View Invoice
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
