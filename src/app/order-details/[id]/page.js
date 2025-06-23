"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
// ... other imports ...

export default function OrderDetailsPage({ params }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    if (!params.id) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products (*)
          )
        `)
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!order) {
    return <div>Order not found</div>;
  }

  return (
    <div>
      <h1>Order Details</h1>
      <p>Order Number: {order.order_number}</p>
      {/* Add more order details display here */}
    </div>
  );
}
