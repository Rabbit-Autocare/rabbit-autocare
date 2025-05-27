'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import '../../../app/globals.css';

export default function CategoryPage({ params }) {
  const category = params.category;

  // State variables to manage the component's data and UI
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('asc');
  const [selectedSize, setSelectedSize] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [imageErrors, setImageErrors] = useState({});
  const [categories] = useState([
    'Interior',
    'Exterior',
    'Engine Parts',
    'Maintenance',
    'All Products',
  ]);
  const router = useRouter();

  // Effect hook that runs when component mounts or when category changes
  useEffect(() => {
    fetchProducts();
  }, [category]);

  // Function to fetch products filtered by category
  const fetchProducts = async () => {
    let query = supabase.from('products').select('*');

    // Only apply category filter if we're not showing all products
    if (category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    setProducts(data || []);
  };

  // Function to reset all filters to their default values
  const clearFilters = () => {
    setSearch('');
    setSort('asc');
    setSelectedSize([]);
    setMinPrice('');
    setMaxPrice('');
  };

  // Function to handle size filter checkbox changes
  const handleSizeChange = (size) => {
    setSelectedSize((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  // Function to handle image load errors
  const handleImageError = (productId) => {
    setImageErrors((prev) => ({
      ...prev,
      [productId]: true,
    }));
  };

  // Function to navigate to a different category
  const handleCategoryChange = (newCategory) => {
    router.push(
      `/shop/${
        newCategory.toLowerCase() === 'all products' ? 'all' : newCategory
      }`
    );
  };

  // Function to get proper image URL or return fallback
  const getImageUrl = (product) => {
    if (!product.image) return null;

    if (product.image.startsWith('http')) {
      return product.image;
    }

    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${product.image}`;
  };

  // Filter products by multiple criteria
  const filteredProducts = products
    .filter((product) =>
      product.name.toLowerCase().includes(search.toLowerCase())
    )
    .filter((product) => {
      const prices = product.variants?.map((v) => v.price) || [];
      const min = prices.length > 0 ? Math.min(...prices) : 0;
      return (
        (!minPrice || min >= parseFloat(minPrice)) &&
        (!maxPrice || min <= parseFloat(maxPrice))
      );
    })
    .filter((product) => {
      if (selectedSize.length === 0) return true;
      const sizes = product.variants?.map((v) => v.size.toLowerCase()) || [];
      return selectedSize.some((size) => sizes.includes(size.toLowerCase()));
    })
    .sort((a, b) => {
      const getMinPrice = (p) => {
        const prices = p.variants?.map((v) => v.price) || [];
        return prices.length > 0 ? Math.min(...prices) : 0;
      };
      return sort === 'asc'
        ? getMinPrice(a) - getMinPrice(b)
        : getMinPrice(b) - getMinPrice(a);
    });

  return (
    <div className='max-w-7xl mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold text-gray-800 mb-6 text-center'>
        {category === 'all' ? 'All Products' : `${category} Products`}
      </h1>

      <div className='flex flex-col md:flex-row gap-8'>
        {/* Left Sidebar: Filters */}
        <aside className='w-full md:w-72 bg-white p-6 shadow-md rounded-lg sticky top-24 h-fit self-start'>
          {/* Search Input */}
          <input
            type='text'
            placeholder='Search by name...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='border p-2 rounded w-full mb-5'
          />

          {/* Categories Dropdown */}
          <div className='mb-5'>
            <label className='block font-semibold mb-2'>Category</label>
            <select
              value={category === 'all' ? 'All Products' : category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className='border p-2 rounded w-full'
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Price Sort Dropdown */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className='border p-2 rounded w-full mb-5'
          >
            <option value='asc'>Sort by Price: Low to High</option>
            <option value='desc'>Sort by Price: High to Low</option>
          </select>

          {/* Price Range Filter */}
          <div className='mb-5'>
            <label className='block font-semibold mb-2'>Price Range (₹)</label>
            <div className='flex gap-3'>
              <input
                type='number'
                placeholder='Min'
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className='border p-2 rounded w-1/2'
              />
              <input
                type='number'
                placeholder='Max'
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className='border p-2 rounded w-1/2'
              />
            </div>
          </div>

          {/* Size Filter */}
          <div className='mb-5'>
            <label className='block font-semibold mb-2'>Sizes</label>
            {['50ml', '100ml', '250ml', '500ml'].map((size) => (
              <label
                key={size}
                className='block text-sm cursor-pointer select-none'
              >
                <input
                  type='checkbox'
                  checked={selectedSize.includes(size)}
                  onChange={() => handleSizeChange(size)}
                  className='mr-2'
                />
                {size}
              </label>
            ))}
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={clearFilters}
            className='w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition'
          >
            Clear Filters
          </button>
        </aside>

        {/* Main Content: Product Grid */}
        <main className='flex-1'>
          {filteredProducts.length === 0 ? (
            <div className='bg-white p-8 rounded-lg shadow text-center'>
              <h3 className='text-xl font-medium mb-2'>No products found</h3>
              <p className='text-gray-600'>
                Try changing your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
              {filteredProducts.map((product) => {
                // Calculate price range
                const prices = product.variants?.map((v) => v.price) || [];
                const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
                const imageUrl = getImageUrl(product);
                const hasImageError = imageErrors[product.id];

                return (
                  <div
                    key={product.id}
                    className='bg-white shadow-md rounded-xl overflow-hidden hover:shadow-lg transition duration-300'
                  >
                    {/* Product Image */}
                    <div className='relative w-full h-48 bg-gray-100'>
                      {imageUrl && !hasImageError ? (
                        <Image
                          src={imageUrl}
                          alt={product.name}
                          fill
                          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                          style={{ objectFit: 'cover' }}
                          priority={false}
                          onError={() => handleImageError(product.id)}
                        />
                      ) : (
                        <div className='absolute inset-0 flex flex-col items-center justify-center text-gray-400'>
                          <svg
                            className='w-12 h-12 mb-2'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                            xmlns='http://www.w3.org/2000/svg'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth='2'
                              d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                            />
                          </svg>
                          <p className='text-sm'>No Image</p>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className='p-4'>
                      <h3 className='text-lg font-semibold text-gray-900'>
                        {product.name}
                      </h3>
                      <p className='text-green-600 font-bold mt-1'>
                        ₹{minPrice}
                        {minPrice !== maxPrice && ` - ₹${maxPrice}`}
                      </p>
                      <p className='text-gray-600 text-sm mt-2 line-clamp-2'>
                        {product.description}
                      </p>
                      <button
                        className='mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md'
                        onClick={() => router.push(`/products/${product.id}`)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
