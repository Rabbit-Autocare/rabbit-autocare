'use client';

import { useState, useEffect } from 'react';
import { ProductService } from '@/lib/service/productService';
import ProductDetail from '@/components/shop/ProductDetail';
import { usePathname, useRouter } from 'next/navigation';

export default function ProductPage() {
  const pathname = usePathname();
  const productCode = pathname.split('/').pop();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productCode) {
        setError('Product code is missing from URL');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      let productData = null;

      try {
        // Try fetching as a product using the API route first
        productData = await ProductService.getProduct(productCode);
        if (productData && productData.id) {
          setProduct(productData);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.log('API route failed, trying direct Supabase:', err.message);

        // If API route fails, try direct Supabase access
        try {
          productData = await ProductService.getProductDirect(productCode);
          if (productData && productData.id) {
            setProduct(productData);
            setLoading(false);
            return;
          }
        } catch (directErr) {
          console.log('Direct Supabase also failed:', directErr.message);
          // Continue to redirect logic below
        }
      }

      // If not a product, redirect to /kitcombo/[id]
      router.replace(`/kitcombo/${productCode}`);
    };

    fetchProduct();
  }, [productCode, router]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <img
            src='/assets/loader.gif'
            alt='Loading...'
            className='h-48 w-48 mx-auto mb-4'
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center max-w-md mx-auto p-6'>
          <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
            <h3 className='text-lg font-semibold text-red-800 mb-2'>Error</h3>
            <p className='text-red-600'>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center max-w-md mx-auto p-6'>
          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
            <h3 className='text-lg font-semibold text-yellow-800 mb-2'>
              Product Not Found
            </h3>
            <p className='text-yellow-600'>
              The product you are looking for does not exist or has been
              removed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white'>
      <ProductDetail product={product} />
    </div>
  );
}
