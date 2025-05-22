'use client';
import Link from 'next/link';

export default function FeaturedProductsSection() {
  const featuredProducts = [
    {
      id: 1,
      name: 'Premium Engine Oil',
      price: 49.99,
      image: '/images/products/engine-oil.jpg',
    },
    {
      id: 2,
      name: 'Brake Pads Set',
      price: 89.99,
      image: '/images/products/brake-pads.jpg',
    },
    {
      id: 3,
      name: 'Air Filter',
      price: 29.99,
      image: '/images/products/air-filter.jpg',
    },
    {
      id: 4,
      name: 'Spark Plugs',
      price: 39.99,
      image: '/images/products/spark-plugs.jpg',
    },
  ];

  return (
    <section className='py-16'>
      <div className='max-w-7xl mx-auto px-4'>
        <h2 className='text-3xl font-bold text-center mb-12'>
          Featured Products
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {featuredProducts.map((product) => (
            <div
              key={product.id}
              className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition'
            >
              <Link href={`/products/${product.id}`}>
                <div className='aspect-square relative'>
                  <div className='absolute inset-0 bg-gray-200' />
                </div>
                <div className='p-4'>
                  <h3 className='font-semibold mb-2'>{product.name}</h3>
                  <p className='text-blue-600 font-bold'>
                    ${product.price.toFixed(2)}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
        <div className='text-center mt-12'>
          <Link
            href='/products'
            className='inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition'
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
}
