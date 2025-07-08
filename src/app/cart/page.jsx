import { Suspense } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { fetchCartItems } from '@/lib/service/cartService';
import { transformCartForCheckout } from '@/lib/utils/cartTransformUtils';
import {
  fetchInitialCombos,
  fetchInitialCoupons,
} from '@/lib/service/initialDataService';
import CartPageClient from '@/components/cart/CartPageClient';

// Loading component for the cart page
function CartPageLoading() {
  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-4xl mx-auto px-4'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-300 rounded mb-6 w-1/3'></div>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            <div className='lg:col-span-2 space-y-4'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='bg-white rounded-lg p-4'>
                  <div className='flex space-x-4'>
                    <div className='w-20 h-20 bg-gray-300 rounded'></div>
                    <div className='flex-1 space-y-2'>
                      <div className='h-4 bg-gray-300 rounded w-3/4'></div>
                      <div className='h-4 bg-gray-300 rounded w-1/2'></div>
                      <div className='h-4 bg-gray-300 rounded w-1/4'></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className='space-y-4'>
              <div className='bg-white rounded-lg p-4'>
                <div className='h-6 bg-gray-300 rounded mb-4 w-1/2'></div>
                <div className='space-y-2'>
                  <div className='h-4 bg-gray-300 rounded'></div>
                  <div className='h-4 bg-gray-300 rounded'></div>
                  <div className='h-4 bg-gray-300 rounded'></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Server component that fetches initial cart data
export default async function CartPage() {
  let initialCartItems = [];
  let initialCombos = [];
  let initialCoupons = [];
  let error = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (userId) {
      console.log('[SSR CartPage] Fetching initial data for user:', userId);

      // Fetch cart items and initial data in parallel
      const [rawCartItems, combos, coupons] = await Promise.all([
        fetchCartItems(userId),
        fetchInitialCombos(userId),
        fetchInitialCoupons(userId),
      ]);

      initialCartItems = await transformCartForCheckout(rawCartItems, userId);
      initialCombos = combos;
      initialCoupons = coupons;

      console.log('[SSR CartPage] Initial data fetched:', {
        cartItems: initialCartItems.length,
        combos: initialCombos.length,
        coupons: initialCoupons.length,
      });
    }
  } catch (e) {
    console.error('[SSR CartPage] Error fetching initial data:', e);
    error = e.message;
    initialCartItems = [];
    initialCombos = [];
    initialCoupons = [];
  }

  return (
    <Suspense fallback={<CartPageLoading />}>
      <CartPageClient
        initialCartItems={initialCartItems}
        initialCombos={initialCombos}
        initialCoupons={initialCoupons}
        initialError={error}
      />
    </Suspense>
  );
}
