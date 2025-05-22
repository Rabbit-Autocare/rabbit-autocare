'use client';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <div className='relative bg-gray-900 text-white'>
      <div
        className='absolute inset-0 z-0 bg-center bg-cover opacity-50'
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1612544448445-b8232cff3b6c?q=80&w=1974&auto=format&fit=crop')",
        }}
      />
      <div className='relative z-10 max-w-7xl mx-auto px-4 py-24 md:py-32 flex flex-col items-center text-center'>
        <h1 className='text-4xl md:text-6xl font-bold mb-6'>
          Car Care Made Simple
        </h1>
        <p className='text-xl md:text-2xl max-w-2xl mb-8'>
          Quality auto parts and accessories delivered to your door
        </p>
        <div className='flex flex-col sm:flex-row gap-4'>
          <Link
            href='/products'
            className='bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-medium transition'
          >
            Shop Now
          </Link>
          <Link
            href='/contact'
            className='bg-white hover:bg-gray-100 text-gray-900 px-8 py-3 rounded-md font-medium transition'
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
