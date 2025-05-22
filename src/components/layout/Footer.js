'use client';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className='bg-gray-900 text-white'>
      <div className='max-w-7xl mx-auto px-4 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
          {/* Company Info */}
          <div>
            <h3 className='text-xl font-bold mb-4'>AutoCare</h3>
            <p className='text-gray-400'>
              Your trusted source for quality auto parts and accessories.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className='text-xl font-bold mb-4'>Quick Links</h3>
            <ul className='space-y-2'>
              <li>
                <Link
                  href='/products'
                  className='text-gray-400 hover:text-white transition'
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  href='/about'
                  className='text-gray-400 hover:text-white transition'
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href='/contact'
                  className='text-gray-400 hover:text-white transition'
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className='text-xl font-bold mb-4'>Customer Service</h3>
            <ul className='space-y-2'>
              <li>
                <Link
                  href='/shipping'
                  className='text-gray-400 hover:text-white transition'
                >
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link
                  href='/returns'
                  className='text-gray-400 hover:text-white transition'
                >
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link
                  href='/faq'
                  className='text-gray-400 hover:text-white transition'
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className='text-xl font-bold mb-4'>Contact Us</h3>
            <ul className='space-y-2 text-gray-400'>
              <li>Email: info@autocare.com</li>
              <li>Phone: (555) 123-4567</li>
              <li>Address: 123 Auto Street, Car City, CC 12345</li>
            </ul>
          </div>
        </div>

        <div className='border-t border-gray-800 mt-12 pt-8 text-center text-gray-400'>
          <p>&copy; {new Date().getFullYear()} AutoCare. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
