'use client';
import Link from 'next/link';

export default function CategoriesSection() {
  const categories = ['Engine Parts', 'Exterior', 'Interior', 'Maintenance'];

  return (
    <section className='py-16 bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4'>
        <h2 className='text-3xl font-bold text-center mb-12'>
          Shop By Category
        </h2>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
          {categories.map((category) => (
            <div
              key={category}
              className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition group'
            >
              <Link href={`/shop/${category}`}>
                <div className='aspect-square relative'>
                  <div className='absolute inset-0 bg-gray-200' />
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <span className='text-gray-600 text-lg'>{category}</span>
                  </div>
                </div>
                <div className='p-4 bg-white'>
                  <h3 className='font-medium text-gray-800 group-hover:text-blue-600 transition'>
                    {category}
                  </h3>
                  <p className='text-gray-500 text-sm mt-1'>
                    Browse our {category.toLowerCase()} collection
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
