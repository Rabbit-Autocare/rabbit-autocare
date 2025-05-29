'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ProductDetail({ product }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Get all product images
  const images = product.images || [];
  
  // Helper to get valid image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/images/placeholder.png';
    if (imagePath.startsWith('http')) return imagePath;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${imagePath}`;
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Left: Image Gallery */}
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative h-96 w-full bg-gray-100 rounded-lg overflow-hidden">
          {images.length > 0 ? (
            <Image
              src={getImageUrl(images[activeImageIndex])}
              alt={product.name}
              fill
              className="object-contain p-4"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-500">No Image Available</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Thumbnail Gallery */}
        {images.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {images.map((img, index) => (
              <button
                key={index}
                className={`relative w-20 h-20 bg-gray-100 rounded-md overflow-hidden ${
                  activeImageIndex === index ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setActiveImageIndex(index)}
              >
                <Image
                  src={getImageUrl(img)}
                  alt={`${product.name} - view ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Right: Product Details */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
        
        <div className="flex items-center">
          <div className="flex mr-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg key={star} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {product.reviews?.length || 0} Reviews
          </span>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900">Description</h3>
          <p className="mt-2 text-gray-600">{product.description}</p>
        </div>
        
        {/* Variants Selection */}
        <div>
          <h3 className="text-lg font-medium text-gray-900">Options</h3>
          <div className="mt-2 grid grid-cols-2 gap-4">
            {product.variants?.map((variant, index) => (
              <div 
                key={index} 
                className="border rounded-md p-3 hover:border-blue-500 cursor-pointer"
              >
                <div className="flex justify-between">
                  <span className="font-medium">{variant.size}</span>
                  <span className="font-bold">₹{variant.price}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {variant.stock > 0 
                    ? `${variant.stock} in stock` 
                    : 'Out of stock'}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Add to Cart */}
        <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors">
          Add to Cart
        </button>
      </div>
    </div>
  );
}