'use client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import '../../app/globals.css';

export default function UserSidebar() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className='w-60 bg-white shadow-md h-auto min-h-screen'>
      <div>
        <div className='text-2xl font-bold text-center py-6 border-b'>
          My Account
        </div>
        <nav className='flex flex-col p-4 space-y-4 text-gray-700 font-medium'>
          <Link href='/user' className='hover:text-blue-600'>
            My Profile
          </Link>
          <Link href='/user/orders' className='hover:text-blue-600'>
            My Orders
          </Link>
          <Link
            href='/user/address-book'
            className={`hover:text-blue-600 ${
              router.pathname === '/user/address-book' ? 'text-blue-600' : ''
            }`}
          >
            Address Book
          </Link>
          <Link
            href='/user/coupons'
            className={`hover:text-blue-600 ${
              router.pathname === '/user/coupons' ? 'text-blue-600' : ''
            }`}
          >
            My Coupons
          </Link>
        </nav>
      </div>

      <div className='p-4 border-t mt-auto'>
        <button
          onClick={handleLogout}
          className='w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded text-sm'
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
