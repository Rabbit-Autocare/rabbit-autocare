'use client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import "../app/globals.css";
export default function UserSidebar() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="w-60 bg-white shadow-md h-screen fixed top-0 left-0 flex flex-col justify-between">
      <div>
        <div className="text-2xl font-bold text-center py-6 border-b">
          Car AutoCare
        </div>
        <nav className="flex flex-col p-4 space-y-4 text-gray-700 font-medium">
          <Link href="/user" className="hover:text-blue-600">
            Dashboard
          </Link>
          <Link href="/user/products" className="hover:text-blue-600">
            Browse Products
          </Link>
          <Link href="/user/cart" className="hover:text-blue-600">
            My Cart
          </Link>
             <Link href="/user/orders" className="hover:text-blue-600">
            Orders
          </Link>
          <Link href="/user/profile" className="hover:text-blue-600">
            My Profile
          </Link>
        </nav>
      </div>

      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded text-sm"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
