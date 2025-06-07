"use client";

import { useEffect, useState, useCallback } from 'react';
// ... other imports ...

export default function OrderDetailsPage({ params }) {
  // ... state declarations ...

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
    }
  }, [params.id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // ... rest of the code ...
}
