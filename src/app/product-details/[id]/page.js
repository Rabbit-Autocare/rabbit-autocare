"use client";

import { useEffect, useState, useCallback } from 'react';
// ... other imports ...

export default function ProductDetailsPage({ params }) {
  // ... state declarations ...

  const fetchProduct = useCallback(async () => {
    if (!params.id) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  }, [params.id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // ... rest of the code ...
}
