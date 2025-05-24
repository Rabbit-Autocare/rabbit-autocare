import React from 'react';
// import MainNavbar from '../MainNavbar';
import '../../app/globals.css';
import CartDrawer from '../cart/CartDrawer';

export default function RootLayout({ children }) {
  return (
    <div className='min-h-screen flex flex-col'>
      <main className='flex-1 py-6'>{children}</main>
      <footer className='bg-gray-800 text-white p-6'>
        <div className='max-w-7xl mx-auto'>
          <p className='text-center'>
            © {new Date().getFullYear()} Car AutoCare. All rights reserved.
          </p>
        </div>
      </footer>
      <CartDrawer />
    </div>
  );
}
