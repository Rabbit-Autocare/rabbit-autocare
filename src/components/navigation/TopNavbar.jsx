'use client';

import Link from 'next/link';
// import { useTheme } from '@/contexts/ThemeContext';
import Image from 'next/image';

// Top navigation links - easy to update
const topNavLinks = [
  { name: 'HOME', href: '/' },
  { name: 'PRODUCTS', href: '/shop/all' },
  // { name: 'BLOGS', href: '/blog' },
  { name: 'ABOUT US', href: '/about' },
  { name: 'GET IN TOUCH', href: '/contact' },
];

export default function TopNavbar() {
  // const { theme, toggleTheme } = useTheme();

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
