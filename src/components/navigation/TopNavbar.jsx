'use client';

import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import Image from 'next/image';

// Top navigation links - easy to update
const topNavLinks = [
  { name: 'HOME', href: '/' },
  { name: 'ABOUT US', href: '/about' },
  { name: 'PRODUCTS', href: '/products' },
  { name: 'BLOGS', href: '/blog' },
  { name: 'GET IN TOUCH', href: '/contact' },
];

export default function TopNavbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className='bg-black text-white py-2 px-[100px]'>
      <div className='container mx-auto flex justify-between items-center'>
        <nav>
          <ul className='flex space-x-6'>
            {topNavLinks.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className='text-sm hover:text-gray-300 transition-colors'
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className='flex items-center space-x-4'>
          <button
            className='text-white hover:text-gray-300 bg-transparent border-none p-2 rounded-md flex items-center justify-center cursor-pointer transition-colors focus:outline-none'
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <circle cx='12' cy='12' r='5' />
                <line x1='12' y1='1' x2='12' y2='3' />
                <line x1='12' y1='21' x2='12' y2='23' />
                <line x1='4.22' y1='4.22' x2='5.64' y2='5.64' />
                <line x1='18.36' y1='18.36' x2='19.78' y2='19.78' />
                <line x1='1' y1='12' x2='3' y2='12' />
                <line x1='21' y1='12' x2='23' y2='12' />
                <line x1='4.22' y1='19.78' x2='5.64' y2='18.36' />
                <line x1='18.36' y1='5.64' x2='19.78' y2='4.22' />
              </svg>
            ) : (
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' />
              </svg>
            )}
            <span className='sr-only'>Toggle theme</span>
          </button>

          <Link href='/login'>
            <button className='text-white hover:text-gray-300 bg-transparent border-none p-2 rounded-md flex items-center justify-center cursor-pointer transition-colors focus:outline-none'>
              <Image
                src='/assets/account.svg'
                alt='user'
                width={20}
                height={20}
              />
              <span className='sr-only'>User account</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}