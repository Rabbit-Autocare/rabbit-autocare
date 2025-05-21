'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import RootLayout from '../../components/layouts/RootLayout';
import Image from 'next/image';
import '../../app/globals.css';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('asc');
  const [selectedSize, setSelectedSize] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, [sort]);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (!error) setProducts(data);
  };

  const clearFilters = () => {
    setSearch('');
    setSort('asc');
    setSelectedSize([]);
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
  };

  const handleSizeChange = (size) => {
    setSelectedSize((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const filteredProducts = products
    .filter((product) =>
      product.name.toLowerCase().includes(search.toLowerCase())
    )
    .filter((product) => {
      if (!selectedCategory) return true;
      return product.category === selectedCategory;
    })
    .filter((product) => {
      const prices = product.variants?.map((v) => v.price) || [];
      const min = Math.min(...prices);
      return (
        (!minPrice || min >= parseFloat(minPrice)) &&
        (!maxPrice || min <= parseFloat(maxPrice))
      );
    })
    .filter((product) => {
      if (selectedSize.length === 0) return true;
      const sizes = product.variants?.map((v) => v.size.toLowerCase());
      return selectedSize.some((size) => sizes?.includes(size.toLowerCase()));
    })
    .sort((a, b) => {
      const getMinPrice = (p) => Math.min(...(p.variants?.map((v) => v.price) || [0]));
      return sort === 'asc'
        ? getMinPrice(a) - getMinPrice(b)
        : getMinPrice(b) - getMinPrice(a);
    });

  return (
    <RootLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Shop Our Products
        </h1>

        <div className="flex gap-8">
          {/* Filter Sidebar */}
          <aside className="w-72 bg-white p-6 shadow-md rounded-lg sticky top-24 h-fit self-start">
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border p-2 rounded w-full mb-5"
            />

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border p-2 rounded w-full mb-5"
            >
              <option value="asc">Sort by Price: Low to High</option>
              <option value="desc">Sort by Price: High to Low</option>
            </select>

            <div className="mb-5">
              <label className="block font-semibold mb-2">Filter by Category</label>
              <input
                type="text"
                placeholder="Enter category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border p-2 rounded w-full"
              />
            </div>

            <div className="mb-5">
              <label className="block font-semibold mb-2">Price Range (₹)</label>
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="border p-2 rounded w-1/2"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="border p-2 rounded w-1/2"
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="block font-semibold mb-2">Sizes</label>
              {['50ml', '100ml', '250ml', '500ml'].map((size) => (
                <label key={size} className="block text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedSize.includes(size)}
                    onChange={() => handleSizeChange(size)}
                    className="mr-2"
                  />
                  {size}
                </label>
              ))}
            </div>

            <button
              onClick={clearFilters}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition"
            >
              Clear Filters
            </button>
          </aside>

          {/* Product Grid - Centered */}
          <main className="flex-1 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const prices = product.variants?.map((v) => v.price) || [];
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                return (
                  <div
                    key={product.id}
                    className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-lg transition duration-300"
                  >
                    {product.image && (
                      <div className="relative w-full h-48">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          style={{ objectFit: 'cover' }}
                          priority={false}
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-green-600 font-bold mt-1">
                        ₹{minPrice}
                        {minPrice !== maxPrice && ` - ₹${maxPrice}`}
                      </p>
                      <p className="text-gray-600 text-sm mt-2 line-clamp-2">{product.description}</p>
                      <button
                        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                        onClick={() => router.push(`/products/${product.id}`)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      </div>
    </RootLayout>
  );
}
