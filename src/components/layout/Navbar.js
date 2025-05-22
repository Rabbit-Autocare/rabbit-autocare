'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className='bg-white shadow-md'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='flex justify-between h-16'>
          <div className='flex items-center'>
            <Link href='/' className='text-2xl font-bold text-blue-600'>
              AutoCare
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className='hidden md:flex items-center space-x-8'>
            <Link
              href='/products'
              className='text-gray-700 hover:text-blue-600 transition'
            >
              Products
            </Link>
            <Link
              href='/about'
              className='text-gray-700 hover:text-blue-600 transition'
            >
              About
            </Link>
            <Link
              href='/contact'
              className='text-gray-700 hover:text-blue-600 transition'
            >
              Contact
            </Link>
            <Link
              href='/cart'
              className='text-gray-700 hover:text-blue-600 transition'
            >
              Cart
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className='md:hidden flex items-center'>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className='text-gray-700 hover:text-blue-600 focus:outline-none'
            >
              <svg
                className='h-6 w-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                ) : (
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 6h16M4 12h16M4 18h16'
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className='md:hidden'>
          <div className='px-2 pt-2 pb-3 space-y-1 sm:px-3'>
            <Link
              href='/products'
              className='block px-3 py-2 text-gray-700 hover:text-blue-600 transition'
            >
              Products
            </Link>
            <Link
              href='/about'
              className='block px-3 py-2 text-gray-700 hover:text-blue-600 transition'
            >
              About
            </Link>
            <Link
              href='/contact'
              className='block px-3 py-2 text-gray-700 hover:text-blue-600 transition'
            >
              Contact
            </Link>
            <Link
              href='/cart'
              className='block px-3 py-2 text-gray-700 hover:text-blue-600 transition'
            >
              Cart
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
