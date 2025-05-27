'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ShopPage() {
  const router = useRouter();

  // Redirect to the "all" category
  useEffect(() => {
    router.push('/shop/all');
  }, [router]);

  // Return a simple loading state while redirecting
  return (
    <div className='p-8 text-center'>
      <p>Redirecting to all products...</p>
    </div>
  );
}
