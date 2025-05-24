'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../hooks/useCart';
import '../app/globals.css';

export default function MainNavbar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Get cart functionality from our new context
  const { cartCount, openCart } = useCart();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };

    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <>
      {/* Top Navigation Strip */}
      <div className='bg-gray-800 text-white py-2 px-4'>
        <div className='max-w-7xl mx-auto flex justify-end items-center'>
          {user ? (
            <div className='flex items-center gap-4'>
              <span className='text-sm'>Welcome, {user.email}</span>
              {/* Check if user is admin and show appropriate link */}
              <Link
                href={user.email?.includes('admin') ? '/admin' : '/user'}
                className='text-sm hover:underline'
              >
                {user.email?.includes('admin') ? 'Admin Panel' : 'My Account'}
              </Link>
              <button
                onClick={handleLogout}
                className='text-sm hover:underline'
              >
                Logout
              </button>
            </div>
          ) : (
            <div className='flex items-center gap-3'>
              <Link href='/login' className='text-sm hover:underline'>
                Login
              </Link>
              <Link href='/register' className='text-sm hover:underline'>
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <header className='bg-white shadow-md sticky top-0 z-50 w-full'>
        <div className='max-w-7xl mx-auto flex items-center justify-between px-4 py-3 md:py-4'>
          {/* Logo */}
          <Link href='/' className='text-2xl font-bold text-blue-700'>
            Car AutoCare
          </Link>

          {/* Desktop Nav */}
          <nav className='hidden md:flex gap-6 items-center text-gray-700 font-medium'>
            <Link
              href='/'
              className={`hover:text-blue-600 ${
                router.pathname === '/' ? 'text-blue-600' : ''
              }`}
            >
              Home
            </Link>
            <Link
              href='/products'
              className={`hover:text-blue-600 ${
                router.pathname === '/products' ? 'text-blue-600' : ''
              }`}
            >
              Shop
            </Link>
            <Link
              href='/combo'
              className={`hover:text-blue-600 ${
                router.pathname === '/combo' ? 'text-blue-600' : ''
              }`}
            >
              Combo & Kits
            </Link>
            <Link
              href='/about'
              className={`hover:text-blue-600 ${
                router.pathname === '/about' ? 'text-blue-600' : ''
              }`}
            >
              About Us
            </Link>
            <Link
              href='/blog'
              className={`hover:text-blue-600 ${
                router.pathname === '/blog' ? 'text-blue-600' : ''
              }`}
            >
              Blog
            </Link>
            <Link
              href='/contact'
              className={`hover:text-blue-600 ${
                router.pathname === '/contact' ? 'text-blue-600' : ''
              }`}
            >
              Get In Touch
            </Link>
            {/* Changed from Link to button with onClick to open drawer */}
            <button
              onClick={openCart}
              className='relative hover:text-blue-600'
              aria-label='Open cart'
            >
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className='absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center'>
                  {cartCount}
                </span>
              )}
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className='flex items-center gap-4 md:hidden'>
            {/* Changed from Link to button with onClick to open drawer */}
            <button
              onClick={openCart}
              className='relative'
              aria-label='Open cart'
            >
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className='absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center'>
                  {cartCount}
                </span>
              )}
            </button>
            <button
              className='text-gray-700'
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className='md:hidden bg-white shadow-inner px-4 py-2 space-y-2 text-gray-700 font-medium'>
            <Link href='/' className='block hover:text-blue-600'>
              Home
            </Link>
            <Link href='/products' className='block hover:text-blue-600'>
              Shop
            </Link>
            <Link href='/combo' className='block hover:text-blue-600'>
              Combo & Kits
            </Link>
            <Link href='/about' className='block hover:text-blue-600'>
              About Us
            </Link>
            <Link href='/blog' className='block hover:text-blue-600'>
              Blog
            </Link>
            <Link href='/contact' className='block hover:text-blue-600'>
              Get In Touch
            </Link>
          </div>
        )}
      </header>
    </>
  );
}
