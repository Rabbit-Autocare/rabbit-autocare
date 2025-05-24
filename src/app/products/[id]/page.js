// ================================
// Individual product page with variant selection and cart functionality
'use client';
import React, { useEffect, useState, use } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import RootLayout from '../../../components/layouts/RootLayout';

export default function ProductDetail({ params }) {
  // Unwrap params promise to get actual params object
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  // State management for product detail page
  const [product, setProduct] = useState(null); // Current product data
  const [selectedVariant, setSelectedVariant] = useState(null); // Currently selected variant (size/price)
  const [quantity, setQuantity] = useState(1); // Quantity to add to cart
  const [userId, setUserId] = useState(null); // Current user ID for cart operations
  const [loading, setLoading] = useState(true); // Loading state for initial data fetch
  const [adding, setAdding] = useState(false); // Loading state for add to cart operation
  
  // Effect to fetch current user when component mounts
  useEffect(() => {
    async function fetchUser() {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id); // Store user ID for cart operations
      } else {
        console.error('User fetch error:', error);
      }
    }
    fetchUser();
  }, []);

  // Effect to fetch product data when productId changes
  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return; // Exit if no product ID

      setLoading(true);

      // Fetch single product by ID from database
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        console.error('Product fetch error:', error);
      } else {
        setProduct(data);
        // Set default variant selection
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]); // Select first variant by default
        } else {
          // Create default variant if no variants exist
          setSelectedVariant({
            size: 'Default',
            price: data.price,
            image: data.image,
          });
        }
      }

      setLoading(false);
    }

    fetchProduct();
  }, [productId]);

  // Function to add current product/variant to user's cart
  const handleAddToCart = async () => {
  if (!userId) {
    alert('Please log in to add items to cart.');
    return;
  }

  if (!selectedVariant || !selectedVariant.price || !selectedVariant.size) {
    alert('Please select a valid size.');
    return;
  }

  setAdding(true);

  // Sanitize and prepare the data to insert
  const cartItem = {
    user_id: userId,
    product_id: product.id,
    quantity,
    name: product.name,
    price: parseFloat(selectedVariant.price), // Ensure it's a number
    image: selectedVariant.image || product.image,
    variant_size: selectedVariant.size,
  };

  console.log('Inserting cart item:', cartItem); // Debug log

  const { error } = await supabase.from('cart_items').insert(cartItem);

  setAdding(false);

  if (error) {
    console.error('Error adding to cart:', error);
    alert('Error adding item to cart. Please try again.');
  } else {
    alert('Item added to cart!');
  }
};

  const handleBuyNow = async () => {
    await handleAddToCart(); // Add to cart first
    window.location.href = '/checkout'; // Navigate to checkout page
  };

  // Loading and error states
  if (loading) return <p className='text-center mt-10'>Loading...</p>;
  if (!product || !product.id || !selectedVariant)
    return <p>Product not found.</p>;

  return (
    <RootLayout>
      <div className='max-w-5xl mx-auto px-4 py-6'>
        <div className='flex flex-col md:flex-row gap-6'>
          {/* Left Side: Product Image */}
          <div className='md:w-1/2'>
            <img
              src={ product.image} // Show variant image or fallback to product image
              alt={product.name}
              className='rounded-xl w-full h-auto border'
            />
          </div>

          {/* Right Side: Product Details and Controls */}
          <div className='md:w-1/2 space-y-4'>
            <h1 className='text-3xl font-bold'>{product.name}</h1>
            <p className='text-gray-600'>{product.description}</p>

            {/* Current Price Display */}
            <p className='text-2xl font-semibold text-blue-600'>
              ₹{selectedVariant.price}
            </p>

            {/* Variant Selection (Size Selection) */}
            <div>
              <h3 className='font-semibold mb-2'>Select Size:</h3>
              <div className='flex gap-2 flex-wrap'>
                {product.variants?.map((variant, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVariant(variant)} // Change selected variant
                    className={`px-4 py-2 rounded-full border ${
                      selectedVariant.size === variant.size
                        ? 'bg-black text-white' // Highlight selected variant
                        : 'bg-gray-100 text-black'
                    }`}
                  >
                    {variant.size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selection Controls */}
            <div className='flex items-center gap-4 mt-4'>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))} // Decrease but don't go below 1
                className='px-3 py-1 rounded-full bg-gray-200'
              >
                -
              </button>
              <span className='text-lg'>{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)} // Increase quantity
                className='px-3 py-1 rounded-full bg-gray-200'
              >
                +
              </button>
            </div>

            {/* Total Price Calculation */}
            <div className='mt-2 text-lg font-semibold'>
              Total: ₹
              {selectedVariant && quantity
                ? (selectedVariant.price * quantity).toFixed(2) // Calculate total price
                : '0.00'}
            </div>

            {/* Action Buttons */}
            <div className='mt-6'>
              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={adding} // Disable during loading
                className='w-full border rounded-lg py-3'
              >
                {adding ? 'Adding...' : 'Add to Shine List'}
              </button>
              {/* Buy Now Button */}
              <button
                onClick={handleBuyNow}
                disabled={adding} // Disable during loading
                className='w-full bg-black text-white py-3 rounded-lg mt-3'
              >
                {adding ? 'Processing...' : 'Buy Now 🛒'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </RootLayout>
  );
}