'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import { Heart, ShoppingCart, Trash2, Star, Package, Box, Gift } from 'lucide-react';
import { WishlistService } from '@/lib/service/wishlistService'; // Add this import

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [addingToCartId, setAddingToCartId] = useState(null);
  const [user, setUser] = useState(null);

  const fetchWishlist = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        setLoading(false);
        return;
      }

      setUser(user);
      console.log('Current user:', user.id);

      // First, try simple query without joins
      const { data: wishlistData, error: wishlistError } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', user.id);

      console.log('Wishlist query result:', { wishlistData, wishlistError });

      if (wishlistError) {
        console.error('Error fetching wishlist:', wishlistError);
        setLoading(false);
        return;
      }

      // If simple query works, try with products join
      if (wishlistData && wishlistData.length > 0) {
        const { data: fullData, error: joinError } = await supabase
          .from('wishlist_items')
          .select(`
            id,
            product_id,
            variant,
            created_at,
            updated_at,
            combo_id,
            kit_id,
            products:product_id (
              id,
              name,
              price,
              image,
              category
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (joinError) {
          console.error('Error with products join:', joinError);
          // Fallback to simple data without products
          setWishlistItems(wishlistData || []);
        } else {
          setWishlistItems(fullData || []);
        }
      } else {
        setWishlistItems([]);
      }

    } catch (error) {
      console.error('Unexpected error:', error);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (id) => {
    setRemovingId(id);
    await new Promise(resolve => setTimeout(resolve, 300)); // Animation delay

    // Use WishlistService for removal
    const { error } = await WishlistService.removeFromWishlist(id);

    if (error) {
      console.error('Error removing from wishlist:', error);
    } else {
      fetchWishlist();
    }
    setRemovingId(null);
  };

  const handleAddToCart = async (item) => {
    setAddingToCartId(item.id);
    
    try {
      const cartItem = {
        user_id: user.id,
        quantity: 1
      };

      // Add appropriate fields based on item type
      if (item.product_id) {
        cartItem.product_id = item.product_id;
        if (item.variant) {
          cartItem.variant = item.variant;
        }
      } else if (item.combo_id) {
        cartItem.combo_id = item.combo_id;
      } else if (item.kit_id) {
        cartItem.kit_id = item.kit_id;
      }

      const { error } = await supabase
        .from('cart_items')
        .upsert(cartItem, {
          onConflict: user.id && item.product_id ? 'user_id,product_id' : 
                     user.id && item.combo_id ? 'user_id,combo_id' : 
                     'user_id,kit_id'
        });

      if (error) {
        console.error('Error adding to cart:', error);
      } else {
        await handleRemove(item.id);
      }
    } catch (error) {
      console.error('Unexpected error adding to cart:', error);
    }
    
    setAddingToCartId(null);
  };

  const getItemDisplayInfo = (item) => {
    // If products data available
    if (item.products && item.product_id) {
      return {
        name: item.products.name,
        price: item.products.price,
        image: item.products.image,
        category: item.products.category,
        rating: item.products.rating || 4.5,
        type: 'product',
        icon: Package
      };
    }
    // If only product_id available (fallback)
    else if (item.product_id) {
      return {
        name: `Product (ID: ${item.product_id})`,
        price: '0.00',
        image: '/placeholder.png',
        category: 'Product',
        rating: 4.5,
        type: 'product',
        icon: Package
      };
    }
    // Combo items
    else if (item.combo_id) {
      return {
        name: `Combo Product (ID: ${item.combo_id})`,
        price: '0.00',
        image: '/placeholder-combo.png',
        category: 'Combo',
        rating: 4.5,
        type: 'combo',
        icon: Box
      };
    }
    // Kit items
    else if (item.kit_id) {
      return {
        name: `Kit Product (ID: ${item.kit_id})`,
        price: '0.00',
        image: '/placeholder-kit.png',
        category: 'Kit',
        rating: 4.5,
        type: 'kit',
        icon: Gift
      };
    }
    // Fallback
    return {
      name: 'Unknown Product',
      price: '0.00',
      image: '/placeholder.png',
      category: 'Unknown',
      rating: 0,
      type: 'unknown',
      icon: Package
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-gray-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading your wishlist...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <Heart className="w-16 h-16 text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Please Login</h2>
            <p className="text-gray-600 mb-8">You need to be logged in to view your wishlist</p>
            <button className="bg-gradient-to-r from-black to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:from-gray-800 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
              Login to Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <Heart className="w-16 h-16 text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Your Wishlist is Empty</h2>
            <p className="text-gray-600 mb-8">Start adding products you love to your wishlist!</p>
            <button className="bg-gradient-to-r from-black to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:from-gray-800 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-6 py-3 shadow-lg mb-6">
            <Heart className="w-6 h-6 text-purple-600 fill-current" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-black to-purple-600 bg-clip-text text-transparent">
              My Wishlist
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} waiting for you
          </p>
        </div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {wishlistItems.map((item, index) => {
            const itemInfo = getItemDisplayInfo(item);
            const isRemoving = removingId === item.id;
            const isAddingToCart = addingToCartId === item.id;
            const IconComponent = itemInfo.icon;
            
            return (
              <div
                key={item.id}
                className={`group relative bg-white border border-gray-200 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${
                  isRemoving ? 'scale-95 opacity-50' : 'hover:scale-[1.02]'
                }`}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                {/* Wishlist Badge */}
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="bg-gradient-to-r from-black to-purple-600 text-white rounded-full p-2 shadow-lg">
                    <Heart className="w-4 h-4 fill-current" />
                  </div>
                </div>

                {/* Product Type Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <div className="bg-black/80 text-white rounded-full p-2 shadow-lg">
                    <IconComponent className="w-4 h-4" />
                  </div>
                </div>

                {/* Product Image */}
                <div className="relative w-full h-48 mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100">
                  <Image
                    src={itemInfo.image || '/placeholder.png'}
                    alt={itemInfo.name}
                    fill
                    className="object-contain group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Product Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors duration-300 line-clamp-2">
                      {itemInfo.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="bg-gradient-to-r from-gray-100 to-purple-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium border border-gray-200">
                        {itemInfo.category}
                      </span>
                    </div>
                  </div>

                  {/* Variant Info */}
                  {item.variant && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 font-medium">
                        {typeof item.variant === 'object' ? JSON.stringify(item.variant) : item.variant}
                      </span>
                    </div>
                  )}

                  {/* Price & Rating */}
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold bg-gradient-to-r from-black to-purple-600 bg-clip-text text-transparent">
                      ${itemInfo.price}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-600">{itemInfo.rating}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={isAddingToCart}
                      className="flex-1 bg-gradient-to-r from-black to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-gray-800 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAddingToCart ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5" />
                          Add to Cart
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={isRemoving}
                      className="bg-white text-red-600 border-2 border-red-200 hover:bg-red-50 hover:border-red-300 p-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="text-center mt-16">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg max-w-md mx-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Love everything?</h3>
            <button className="bg-gradient-to-r from-black to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-gray-800 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
              Add All to Cart
            </button>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}