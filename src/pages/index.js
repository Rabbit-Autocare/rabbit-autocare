'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import RootLayout from '../components/layouts/RootLayout';
import { supabase } from '../lib/supabaseClient';
import '../app/globals.css';

/**
 * Home page component - Landing page for the Rabbit Auto Care website
 * Displays featured products, categories, testimonials and promotional sections
 */
export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    /**
     * Fetches a limited number of recent products to display as featured
     * Updates the component state with product data from Supabase
     */
    const fetchFeaturedProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);

      if (!error) {
        setFeaturedProducts(data || []);
      }
      setLoading(false);
    };

    fetchFeaturedProducts();
  }, []);

  return (
    <RootLayout>
      {/* Hero Section */}
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

      {/* Categories Section */}
      <section className='py-16 bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4'>
          <h2 className='text-3xl font-bold text-center mb-12'>
            Shop By Category
          </h2>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
            {['Engine Parts', 'Exterior', 'Interior', 'Maintenance'].map(
              (category) => (
                <div
                  key={category}
                  className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition group'
                >
                  <Link href={`/products?category=${category}`}>
                    <div className='aspect-square relative'>
                      <div className='absolute inset-0 bg-gray-200' />
                      {/* We'll use placeholder for now - you can replace with actual category images */}
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <span className='text-gray-600 text-lg'>
                          {category}
                        </span>
                      </div>
                    </div>
                    <div className='p-4 bg-white'>
                      <h3 className='font-semibold group-hover:text-blue-600 transition'>
                        {category}
                      </h3>
                    </div>
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className='py-16'>
        <div className='max-w-7xl mx-auto px-4'>
          <h2 className='text-3xl font-bold text-center mb-12'>
            Featured Products
          </h2>

          {loading ? (
            <div className='text-center py-12'>Loading products...</div>
          ) : featuredProducts.length > 0 ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className='bg-white shadow-md rounded-xl overflow-hidden hover:shadow-lg transition'
                >
                  <Link href={`/products/${product.id}`}>
                    {product.image ? (
                      <div className='relative w-full h-48'>
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes='(max-width: 768px) 100vw, 25vw'
                          style={{ objectFit: 'cover' }}
                          className='rounded-t-xl'
                        />
                      </div>
                    ) : (
                      <div className='bg-gray-200 w-full h-48 flex items-center justify-center'>
                        <span className='text-gray-500'>No image</span>
                      </div>
                    )}
                    <div className='p-4'>
                      <h3 className='font-semibold text-lg'>{product.name}</h3>
                      <p className='text-green-600 font-bold mt-1'>
                        ₹{product.price}
                      </p>
                      <p className='text-gray-600 text-sm mt-2 line-clamp-2'>
                        {product.description || 'No description available'}
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-12'>No products available</div>
          )}

          <div className='text-center mt-8'>
            <Link
              href='/products'
              className='inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition'
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className='py-16 bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4'>
          <h2 className='text-3xl font-bold text-center mb-12'>
            Why Choose Us
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {[
              {
                title: 'Expert Advice',
                description:
                  'Our team of automotive experts is always ready to help you find the right parts for your vehicle.',
              },
              {
                title: 'Fast Shipping',
                description:
                  'Enjoy quick delivery on all orders with our efficient shipping network across the country.',
              },
              {
                title: 'Quality Guaranteed',
                description:
                  'We stock only high-quality, genuine parts to ensure the best performance for your vehicle.',
              },
            ].map((benefit, index) => (
              <div key={index} className='bg-white p-6 rounded-lg shadow-md'>
                <h3 className='text-xl font-semibold mb-3'>{benefit.title}</h3>
                <p className='text-gray-600'>{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className='py-16'>
        <div className='max-w-7xl mx-auto px-4'>
          <h2 className='text-3xl font-bold text-center mb-12'>
            What Our Customers Say
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {[
              {
                name: 'Rahul M.',
                text: 'Great quality parts and excellent service. My go-to shop for all my car maintenance needs.',
              },
              {
                name: 'Priya S.',
                text: 'Fast shipping and the parts were exactly as described. Will definitely order again!',
              },
              {
                name: 'Vikram J.',
                text: 'The team was very helpful in helping me find the right parts for my vintage car. Highly recommend!',
              },
            ].map((testimonial, index) => (
              <div key={index} className='bg-white p-6 rounded-lg shadow-md'>
                <div className='flex items-center mb-4'>
                  <div className='w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3'>
                    <span className='text-gray-600 font-semibold'>
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <span className='font-medium'>{testimonial.name}</span>
                </div>
                <p className='text-gray-600 italic'>
                  &ldquo;{testimonial.text}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className='py-16 bg-blue-600 text-white'>
        <div className='max-w-7xl mx-auto px-4 text-center'>
          <h2 className='text-3xl font-bold mb-6'>
            Ready to Upgrade Your Ride?
          </h2>
          <p className='text-xl max-w-2xl mx-auto mb-8'>
            Browse our extensive catalog of quality auto parts and accessories.
          </p>
          <Link
            href='/products'
            className='inline-block bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-md font-medium transition'
          >
            Shop Now
          </Link>
        </div>
      </section>
    </RootLayout>
  );
}
