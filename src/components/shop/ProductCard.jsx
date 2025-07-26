'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Star, Heart, Sparkles } from 'lucide-react';
import { WishlistService } from '@/lib/service/wishlistService'; // Step 1: Import service
import ProductRating from '@/components/ui/ProductRating';
import { useCart } from '@/hooks/useCart'; // Added this import for useCart
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/CustomToast.jsx';

export default function ProductCard({ product, index }) {
  // Only use user from useCart context
  const { user } = useAuth();
  const router = useRouter();
  const [hasImageError, setHasImageError] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistItemId, setWishlistItemId] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  console.log('[ProductCard] user from useCart:', user);

  // Validate product data
  if (!product) {
    console.error('ProductCard received null/undefined product');
    return null;
  }

  const handleImageError = () => {
    console.log('Image error for product:', product.name);
    setHasImageError(true);
  };

  // Replace calculateMaxPrice with logic to get the highest base_price among variants
  const calculateMaxBasePrice = () => {
    try {
      if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
        const basePrices = product.variants
          .map((variant) => Number(variant?.base_price) || 0 || Number(variant?.price))
          .filter((price) => !isNaN(price));
        if (basePrices.length > 0) {
          return Math.max(...basePrices);
        }
      }
      // Fallback to product.base_price, product.price, or 0
      return Number(product.base_price) || Number(product.price) || 0;
    } catch (error) {
      console.error('Error calculating max base price for product:', product.name, error);
      return 0;
    }
  };
  const maxPrice = calculateMaxBasePrice();

  // Get the main image with improved error handling
  const getImageUrl = (url) => {
    if (!url) return '/placeholder.svg?height=200&width=200';

    try {
      // If it's already a full URL, return it
      new URL(url);
      return url;
    } catch {
      // Handle relative URLs or file names
      if (typeof url === 'string' && url.trim()) {
        if (!url.startsWith('http') && !url.startsWith('/')) {
          // Construct full URL for Supabase storage
          const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          if (baseUrl) {
            return `${baseUrl}/storage/v1/object/public/product-images/${url}`;
          }
        }
        if (url.startsWith('/')) {
          return url;
        }
      }
      return '/placeholder.svg?height=200&width=200';
    }
  };

  // Try multiple image sources
  const getMainImage = () => {
    const imageSources = [
      product.main_image_url,
      product.mainImage,
      product.image,
      product.images?.[0],
      product.imageUrl,
    ].filter(Boolean);

    return imageSources.length > 0
      ? getImageUrl(imageSources[0])
      : '/placeholder.svg?height=200&width=200';
  };

  const imageUrl = getMainImage();

  // Deterministic pseudo-random generator based on a string seed
  function seededRandom(seed) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h += h << 13; h ^= h >>> 7;
      h += h << 3; h ^= h >>> 17;
      h += h << 5;
      return ((h >>> 0) % 10000) / 10000;
    };
  }

  // Generate deterministic ratings array for a product
  function generateDeterministicRatings(product) {
    const seed = String(product.product_code || product.id || product.name || 'default');
    const rand = seededRandom(seed);
    const avg = Math.round((rand() * 0.6 + 4) * 10) / 10; // 4.0 to 4.6
    const ratings = Array(13).fill(0).map(() => 4 + Math.round(rand() * 2)); // 4, 5, or 6
    // Adjust to get close to target avg
    let currentAvg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    let i = 0;
    while (Math.abs(currentAvg - avg) > 0.05 && i < 100) {
      const idx = Math.floor(rand() * ratings.length);
      if (currentAvg > avg && ratings[idx] > 4) ratings[idx]--;
      if (currentAvg < avg && ratings[idx] < 5) ratings[idx]++;
      currentAvg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      i++;
    }
    return ratings;
  }

  const ratings = generateDeterministicRatings(product);

  // Get product ID for navigation
  const productIdentifier =
    product.product_code || product.id || product._id || product.productId;

  const handleViewProduct = () => {
    if (!productIdentifier) {
      console.error(
        'Cannot navigate: Product identifier (product_code or ID) is missing',
        product
      );
      return;
    }
    router.push(`/products/${productIdentifier}`);
  };

  // Format product name with fallback
  const productName = product.name || product.title || `Product ${index + 1}`;

  // Format description with fallback
  const description =
    product.description ||
    product.shortDescription ||
    'High quality car care product designed for optimal performance and lasting results.';

  const showToast = useToast();

  return (
    <div
      className='bg-white overflow-hidden hover:shadow-2xl transition-all duration-300 ease-in-out flex flex-col cursor-pointer relative border border-gray-200 rounded-sm transform hover:-translate-y-1'
      style={{ width: '300px', height: '480px' }}
      onClick={handleViewProduct}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image - Full width with zoom effect */}
      <div className='relative h-56 w-full bg-gray-50 flex-shrink-0 overflow-hidden'>
        {imageUrl && !hasImageError ? (
          <Image
            src={imageUrl}
            alt={productName}
            fill
            className={`object-cover object-top transition-transform duration-500 ease-in-out ${
              isHovered ? 'scale-110' : 'scale-100'
            }`}
            onError={handleImageError}
            unoptimized={!imageUrl.startsWith('http')}
            sizes='300px'
          />
        ) : (
          <div className='flex items-center justify-center h-full bg-gray-50'>
            <div className='text-center'>
              <svg
                className='w-12 h-12 text-gray-300 mx-auto mb-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.5}
                  d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z'
                />
              </svg>
              <span className='text-gray-400 text-xs'>No Image</span>
            </div>
          </div>
        )}
      </div>

      {/* Product Details - Even spacing with flex distribution */}
      <div className='px-5 py-4 flex flex-col flex-grow justify-between'>
        {/* Top Section: Title and Rating */}
        <div className="flex flex-col gap-2 mb-3">
          <h3 className="font-semibold text-base line-clamp-1 leading-tight">{product.name}</h3>
          <ProductRating ratings={ratings} size={16} showCount={true} />
        </div>

        {/* Middle Section: Description */}
        <div className="flex-grow flex items-start mb-4">
          <p className='text-sm text-gray-600 line-clamp-2 leading-relaxed'>
            {description}
          </p>
        </div>

        {/* Bottom Section: Price and Button - Fixed at Bottom */}
        <div className='space-y-4'>
          <hr className='border-gray-200' />

          <div className='flex items-center justify-between'>
            <div className='flex items-baseline gap-2'>
              <span className='text-xl font-bold text-gray-900'>
                ₹{maxPrice || 0}
              </span>
              {product.originalPrice && product.originalPrice > maxPrice && (
                <span className='text-sm text-gray-400 line-through'>
                   ₹{Math.round(product.originalPrice)}
                </span>
              )}
            </div>
          </div>

          {/* View in Detail Button with purple hover */}
          <button
            className='w-full bg-gray-900 text-white py-3 px-4 rounded-sm text-sm font-medium hover:bg-[#601e8d] hover:text-white transition-all duration-300 ease-in-out flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]'
            onClick={(e) => {
              e.stopPropagation();
              handleViewProduct();
            }}
          >
            View in Detail
          </button>
        </div>
      </div>
    </div>
  );
}
