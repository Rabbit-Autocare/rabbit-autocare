'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import UserLayout from '@/components/layouts/UserLayout';
import '@/app/globals.css';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Only fetch orders if we have confirmed the session state
    if (sessionChecked) {
      if (user) {
        fetchOrders(user.id);
      } else {
        setLoading(false);
      }
    }
  }, [user, sessionChecked]);

  const fetchOrders = async (userId) => {
    try {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
    setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <UserLayout>
        <div className='p-6 text-center'>Loading orders...</div>
      </UserLayout>
    );
  }
  }

  return (
    <UserLayout>
      <div className='p-4 space-y-6'>
        <h1 className='text-2xl font-bold'>Order History</h1>
        {orders.map((order) => (
          <div
            key={order.id}
            className='bg-white rounded-lg shadow border overflow-hidden'
          >
            <div className='flex justify-between items-start p-4 border-b'>
              <div>
                <p
                  className={`text-sm font-semibold ${
                    order.status === 'delivered'
                      ? 'text-green-600'
                      : order.status === 'shipped'
                      ? 'text-purple-600'
                      : 'text-red-600'
                  }`}
                >
                  {order.status || 'Processing'}
                </p>
                <p className='text-sm text-gray-500 mt-1'>
                  {formatDate(order.created_at)}
                </p>
              </div>
              <button onClick={() => router.push(`/user/orders/${order.id}`)}>
                <span className='text-xl text-gray-400'>&#x276F;</span>
              </button>
            </div>
            {order.items?.slice(0, 1).map((item, idx) => (
              <div
                key={idx}
                className='flex items-center gap-4 p-4 border-b last:border-none'
              >
                <div className='w-16 h-16 bg-gray-100 rounded-md overflow-hidden'>
                  <Image
                    src={item.main_image_url || item.images?.[0] || '/placeholder.jpg'}
                    alt={item.name}
                    width={64}
                    height={64}
                    className='object-cover w-full h-full'
                  />
                </div>
                <div>
                  <h4 className='font-medium'>{item.name}</h4>
                  <p className='text-sm text-gray-500'>Qty: {item.quantity}</p>
                  <p className='text-sm font-semibold'>₹{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </UserLayout>
  );
}