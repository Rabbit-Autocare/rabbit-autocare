import React from 'react';
import RootLayout from '../../components/layouts/RootLayout';

export default function BlogPage() {
  return (
    <RootLayout>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        <h1 className='text-3xl font-bold mb-6'>Our Blog</h1>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {/* Blog post placeholders */}
          {[1, 2, 3, 4, 5, 6].map((post) => (
            <div
              key={post}
              className='bg-white shadow-md rounded-lg overflow-hidden'
            >
              <div className='h-48 bg-gray-200'></div>
              <div className='p-4'>
                <h2 className='text-xl font-bold mb-2'>
                  Blog Post Title #{post}
                </h2>
                <p className='text-sm text-gray-500 mb-2'>
                  May {post + 10}, 2025
                </p>
                <p className='text-gray-700 mb-4'>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
                <button className='text-blue-600 hover:underline'>
                  Read More
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </RootLayout>
  );
}
