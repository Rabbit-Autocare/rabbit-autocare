'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import '../app/globals.css';

export default function MainNavbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);

      if (data?.user) {
        // Fetch cart count
        const { data: cartItems } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', data.user.id);

        setCartCount(cartItems?.length || 0);
      }
      setLoading(false);
    };

    getUser();

    // Set up subscription for cart updates
    const channel = supabase
      .channel('cart_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
        },
        () => {
          if (user) getUser();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <>
      {/* Top Navigation Bar - Dark */}
      <div className='bg-black text-white py-2 px-4'>
        <div className='max-w-7xl mx-auto flex items-center justify-between'>
          {/* Main navigation links */}
          <div className='flex items-center space-x-6'>
            <Link href='/' className='hover:text-gray-300'>
              HOME
            </Link>
            <Link href='/about' className='hover:text-gray-300'>
              ABOUT US
            </Link>
            <Link href='/blog' className='hover:text-gray-300'>
              BLOGS
            </Link>
            <Link href='/contact' className='hover:text-gray-300'>
              GET IN TOUCH
            </Link>
          </div>

          {/* Right side - Theme toggle and account */}
          <div className='flex items-center space-x-4'>
            {/* Theme Toggle */}
            <button className='flex items-center justify-center'>
              <Image
                src='/assets/night-mode.svg'
                alt='Toggle Theme'
                width={29}
                height={29}
              />
            </button>

            {/* Account Button */}
            <button
              onClick={
                loading
                  ? null
                  : user
                  ? () =>
                      router.push(
                        user.email?.includes('admin') ? '/admin' : '/user'
                      )
                  : handleLogin
              }
              className='flex items-center justify-center'
            >
              <Image
                src='/assets/account.svg'
                alt='Account'
                width={25}
                height={25}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Logo Section */}
      <div className='bg-white py-4 flex justify-center border-b border-gray-100'>
        <Link href='/' className='flex-shrink-0'>
          <Image
            src='/assets/Main Logo.png'
            alt='Rabbit Auto Care'
            width={125}
            height={40}
            style={{ objectFit: 'contain' }}
          />
        </Link>
      </div>

      {/* Secondary Navigation - White */}
      <div className='bg-white shadow-sm py-4 px-4'>
        <div className='max-w-7xl mx-auto flex items-center justify-between'>
          {/* Desktop Category Navigation */}
          <div className='flex items-center space-x-8 text-gray-700 font-medium'>
            <Link
              href='/interior'
              className={`hover:text-blue-600 ${
                router.pathname === '/interior' ? 'text-blue-600' : ''
              }`}
            >
              INTERIOR
            </Link>
            <Link
              href='/exterior'
              className={`hover:text-blue-600 ${
                router.pathname === '/exterior' ? 'text-blue-600' : ''
              }`}
            >
              EXTERIOR
            </Link>
            <Link
              href='/microfibers'
              className={`hover:text-blue-600 ${
                router.pathname === '/microfibers' ? 'text-blue-600' : ''
              }`}
            >
              MICROFIBERS
            </Link>
            <Link
              href='/kits'
              className={`hover:text-blue-600 ${
                router.pathname === '/kits' ? 'text-blue-600' : ''
              }`}
            >
              KITS
            </Link>
          </div>

          {/* Right Side Icons */}
          <div className='flex items-center space-x-6'>
            {/* Search Button */}
            <button className='flex items-center justify-center'>
              <Image
                src='/assets/search.svg'
                alt='Search'
                width={25}
                height={25}
              />
            </button>

            {/* Shine Button */}
            <button className='flex items-center justify-center'>
              <Image
                src='/assets/shine.svg'
                alt='Shine'
                width={25}
                height={25}
              />
            </button>

            {/* Cart Button */}
            <Link href='/cart' className='relative'>
              <Image
                src='/assets/cart-icon.svg'
                alt='Cart'
                width={24}
                height={24}
              />
              {cartCount > 0 && (
                <span className='absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center'>
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
