'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ProductDetail from '@/components/shop/ProductDetail';
import Layout from '@/components/layouts/MainLayout';
import Loading from '@/components/ui/Loading';

export default function ProductPage({ params }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) throw error;
        setProduct(data);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Could not load the product. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [params.id]);

  if (loading) {
    return (
      <Layout>
        <div className='container mx-auto py-8'>
          <Loading />
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className='container mx-auto py-8'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-red-600'>Error</h1>
            <p className='mt-2'>{error || 'Product not found'}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='container mx-auto py-8 px-4'>
        <ProductDetail product={product} />
      </div>
    </Layout>
  );
}
