// app/wishlist/page.js or wherever your wishlist page is located
'use client';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { WishlistService } from '@/lib/service/wishlistService';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/CustomToast.jsx';
import { ProductService } from '@/lib/service/productService';
import RelatedProducts from '@/components/shop/RelatedProducts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function extractPackSize(variantCode) {
  const match = typeof variantCode === 'string' ? variantCode.match(/-(\d+)X$/i) : null;
  return match ? parseInt(match[1], 10) : undefined;
}

function getBestImageUrl(product) {
  const imageSources = [
    product.main_image_url,
    product.mainImage,
    ...(Array.isArray(product.images) ? product.images : []),
    product.image,
    product.image_url,
    product.imageUrl,
    product.thumbnails?.[0],
  ].filter(Boolean);

  let url = imageSources.length > 0 ? imageSources[0] : '/placeholder.svg?height=400&width=400';

  try {
    new URL(url);
    return url;
  } catch {
    if (typeof url === 'string' && url.trim()) {
      if (!url.startsWith('http') && !url.startsWith('/')) {
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (baseUrl) {
          return `${baseUrl}/storage/v1/object/public/product-images/${url}`;
        }
      }
      if (url.startsWith('/')) {
        return url;
      }
    }
    return '/placeholder.svg?height=400&width=400';
  }
}

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [addingToCartId, setAddingToCartId] = useState(null);

  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { addToCart } = useCart();
  const showToast = useToast();
  const router = useRouter();

  const handleContinueShopping = () => {
    router.push('/');
  };

  const handleMoveAllToCart = async () => {
    if (!addToCart) {
      showToast('Unable to add to cart', { type: 'error' });
      return;
    }

    try {
      let successCount = 0;
      for (const item of wishlistItems) {
        let success = false;
        let productObj = null;

        if (item.product_id) {
          productObj = { id: item.product_id };
        } else if (item.combo_id) {
          productObj = { combo_id: item.combo_id };
        } else if (item.kit_id) {
          productObj = { kit_id: item.kit_id };
        }

        const variant = item.variant;

        if (productObj && variant) {
          success = await addToCart(productObj, variant, 1);
        }

        if (success) {
          await WishlistService.removeFromWishlist(item.id);
          successCount++;
        } else {
          showToast(`Failed to add ${item.variant?.variant_code || item.id} to cart.`, { type: 'error' });
        }
      }

      fetchWishlist();
      showToast(`${successCount} items moved to cart`, { type: 'success' });
    } catch (error) {
      showToast('Error moving items to cart', { type: 'error' });
      console.error('Move all to cart error:', error);
    }
  };

  const fetchWishlist = useCallback(async () => {
    console.log('🔍 Debug - Auth state:', { isAuthenticated, user: !!user, authLoading });

    // Wait for auth to be ready
    if (authLoading) {
      console.log('⏳ Auth still loading, waiting...');
      return;
    }

    if (!isAuthenticated || !user) {
      console.log('❌ Not authenticated');
      setWishlistItems([]);
      setLoading(false);
      return;
    }

    console.log('✅ Fetching wishlist for user:', user.id);
    setLoading(true);

    try {
      const { data } = await WishlistService.getWishlist();
      console.log('📦 Wishlist data received:', data);
      setWishlistItems(data || []);
    } catch (error) {
      console.error('❌ Wishlist fetch error:', error);
      setWishlistItems([]);
      showToast('Failed to fetch wishlist', { type: 'error' });
    }
    setLoading(false);
  }, [isAuthenticated, user, authLoading, showToast]);

  useEffect(() => {
    if (!authLoading) {
      fetchWishlist();
    }
  }, [fetchWishlist, authLoading]);

  const handleRemove = async (id) => {
    setRemovingId(id);
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
      await WishlistService.removeFromWishlist(id);
      fetchWishlist();
      showToast('Item removed from wishlist', { type: 'success' });
    } catch (error) {
      showToast('Failed to remove item', { type: 'error' });
    }
    setRemovingId(null);
  };

  const handleAddToCart = async (item) => {
    setAddingToCartId(item.id);
    try {
      let success = false;
      if (addToCart) {
        if (item.product_id) {
          success = await addToCart({ id: item.product_id }, item.variant, 1);
        } else if (item.combo_id) {
          success = await addToCart({ combo_id: item.combo_id }, item.variant, 1);
        } else if (item.kit_id) {
          success = await addToCart({ kit_id: item.kit_id }, item.variant, 1);
        }
      }
      if (success) {
        await handleRemove(item.id);
        showToast('Item moved to cart', { type: 'success' });
      } else {
        showToast('Failed to add to cart', { type: 'error' });
      }
    } catch (error) {
      showToast('Failed to add to cart', { type: 'error' });
    }
    setAddingToCartId(null);
  };

  const getItemDisplayInfo = (item) => {
    if (item.products && item.product_id) {
      const product = ProductService.transformProductData(item.products);
      let variant = null;
      if (item.variant?.id) {
        variant = product.variants?.find(v => String(v.id) === String(item.variant.id));
      }
      if (!variant && product.variants?.length) {
        variant = product.variants[0];
      }

      let packSize;
      if (product.product_type === 'microfiber' && variant?.variant_code) {
        packSize = extractPackSize(variant.variant_code);
      }

      let color = '';
      if (variant?.color) {
        color = Array.isArray(variant.color) ? variant.color.join(', ') : variant.color;
      }

      return {
        name: product.name,
        description: product.description || '',
        image: getBestImageUrl(product),
        price: variant?.base_price || 0,
        category: product.category,
        rating: product.rating || 4.5,
        type: product.product_type,
        variant: {
          size: variant?.size,
          packSize,
          quantity: variant?.quantity,
          unit: variant?.unit,
          color,
        },
        variant_code: variant?.variant_code || variant?.code || variant?.id || '',
      };
    } else if (item.combo_id) {
      return {
        name: `Combo Product`,
        description: '',
        price: item.variant?.base_price || '0.00',
        image: '/placeholder-combo.png',
        category: 'Combo',
        rating: 4.5,
        type: 'combo',
        variant: item.variant,
        variant_code: item.variant?.variant_code || item.variant?.code || item.variant?.id || '',
      };
    } else if (item.kit_id) {
      return {
        name: `Kit Product`,
        description: '',
        price: item.variant?.base_price || '0.00',
        image: '/placeholder-kit.png',
        category: 'Kit',
        rating: 4.5,
        type: 'kit',
        variant: item.variant,
        variant_code: item.variant?.variant_code || item.variant?.code || item.variant?.id || '',
      };
    }
    return {
      name: 'Unknown Product',
      description: '',
      price: '0.00',
      image: '/placeholder.svg?height=400&width=400',
      category: 'Unknown',
      rating: 0,
      type: 'unknown',
      variant: item.variant,
      variant_code: item.variant?.variant_code || item.variant?.code || item.variant?.id || '',
    };
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-gray-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading your shine list...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <div className="relative w-16 h-16">
                <Image src="/assets/shine.svg" alt="shine" fill className="object-contain" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Please Login</h2>
            <p className="text-gray-600 mb-8">You need to be logged in to view your shine list</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-gradient-to-r from-black to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:from-gray-800 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Login to Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show empty wishlist
  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <div className="relative w-16 h-16">
                <Image src="/assets/shine.svg" alt="shine" fill className="object-contain" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Your Shine List is Empty</h2>
            <p className="text-gray-600 mb-8">Start adding products you love to your shine list!</p>
            <button
              onClick={handleContinueShopping}
              className="bg-gradient-to-r from-black to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:from-gray-800 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Wishlist table display
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      <div className="container mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Shinelist ({wishlistItems.length} items)</h1>
          {/* Debug button - remove in production */}
          <button
            onClick={() => {
              console.log('🔄 Manual fetch triggered');
              fetchWishlist();
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded text-sm"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200 mb-12">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {wishlistItems.map((item) => {
                const itemInfo = getItemDisplayInfo(item);
                const isRemoving = removingId === item.id;
                const isAddingToCart = addingToCartId === item.id;

                return (
                  <tr key={item.id} className={isRemoving ? 'opacity-50' : ''}>
                    <td className="px-4 py-4 text-center">
                      <input type="checkbox" className="form-checkbox h-5 w-5 text-purple-600" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <Image
                            src={itemInfo.image || '/placeholder.svg?height=400&width=400'}
                            alt={itemInfo.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{itemInfo.name}</div>
                          <div className="text-gray-500 text-xs line-clamp-1">{itemInfo.description}</div>
                          {itemInfo.variant && (
                            <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-600">
                              {itemInfo.variant.size && <span>Size: {itemInfo.variant.size}</span>}
                              {itemInfo.variant.packSize && <span>Pack: {itemInfo.variant.packSize}</span>}
                              {itemInfo.variant.quantity && <span>Qty: {itemInfo.variant.quantity}</span>}
                              {itemInfo.variant.unit && <span>Unit: {itemInfo.variant.unit}</span>}
                              {itemInfo.variant.color && <span>Color: {itemInfo.variant.color}</span>}
                            </div>
                          )}
                          {itemInfo.variant_code && (
                            <div className="text-xs text-gray-500 mt-1">Code: {itemInfo.variant_code}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-semibold text-gray-900">₹{itemInfo.price}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button className="px-2 py-1 bg-gray-200 rounded text-gray-700" disabled>-</button>
                        <span>1</span>
                        <button className="px-2 py-1 bg-gray-200 rounded text-gray-700" disabled>+</button>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-semibold text-gray-900">₹{itemInfo.price}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAddToCart(item)}
                          disabled={isAddingToCart}
                          className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
                        >
                          {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                        </button>
                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={isRemoving}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mb-12">
          <Link href="/shop" className="text-purple-700 hover:underline">Continue Shopping</Link>
          <button
            onClick={handleMoveAllToCart}
            className="bg-black text-white px-6 py-3 rounded font-semibold hover:bg-purple-700 transition-colors"
          >
            Move All To Cart
          </button>
        </div>

        {/* Related Products Section */}
        <RelatedProducts />
      </div>
    </div>
  );
}
