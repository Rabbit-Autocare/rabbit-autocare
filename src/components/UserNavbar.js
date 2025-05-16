'use client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { useState } from 'react';
import { Menu, X } from 'lucide-react'; // Optional: install lucide-react for icons
import '../app/globals.css';

export default function Navbar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 md:py-4">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-blue-700">
          Car AutoCare
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-6 items-center text-gray-700 font-medium">
          <Link href="/user" className="hover:text-blue-600">Dashboard</Link>
          <Link href="/user/products" className="hover:text-blue-600">Browse Products</Link>
          <Link href="/user/cart" className="hover:text-blue-600">My Cart</Link>
          <Link href="/user/orders" className="hover:text-blue-600">Orders</Link>
          <Link href="/user/profile" className="hover:text-blue-600">My Profile</Link>
          <button
            onClick={handleLogout}
            className="ml-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
          >
            Logout
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-700"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-inner px-4 py-2 space-y-2 text-gray-700 font-medium">
          <Link href="/user" className="block hover:text-blue-600">Dashboard</Link>
          <Link href="/user/products" className="block hover:text-blue-600">Browse Products</Link>
          <Link href="/user/cart" className="block hover:text-blue-600">My Cart</Link>
          <Link href="/user/orders" className="block hover:text-blue-600">Orders</Link>
          <Link href="/user/profile" className="block hover:text-blue-600">My Profile</Link>
          <button
            onClick={handleLogout}
            className="w-full mt-2 bg-red-500 hover:bg-red-600 text-white py-2 rounded text-sm"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
