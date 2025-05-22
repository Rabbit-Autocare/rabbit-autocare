'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import '../../app/globals.css';
import RootLayout from '../../components/layouts/RootLayout';

export default function ProductDetail() {
  const router = useRouter();
  const { id: productId } = router.query;

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      } else {
        console.error('User fetch error:', error);
      }
    }
    fetchUser();
  }, []);

  // Update the useEffect for fetching product
  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return;

      setLoading(true);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        console.error('Product fetch error:', error);
      } else {
        setProduct(data);
        // Set a default variant or create one from product data if variants don't exist
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        } else {
          // Create a default variant using product data
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

  // ✅ Add to Cart Handler
  const handleAddToCart = async () => {
    if (!userId) {
      alert('Please log in to add items to cart.');
      return;
    }

    if (!selectedVariant) {
      alert('Please select a size.');
      return;
    }

    setAdding(true);

    const { error } = await supabase.from('cart_items').insert({
      user_id: userId,
      product_id: product.id,
      quantity,
      name: product.name,
      price: selectedVariant.price,
      image: selectedVariant.image || product.image,
      variant_size: selectedVariant.size,
    });

    setAdding(false);

    if (error) {
      console.error('Error adding to cart:', error);
      alert('Error adding item to cart.');
    } else {
      alert('Item added to cart!');
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    window.location.href = '/checkout';
  };

  if (loading) return <p className='text-center mt-10'>Loading...</p>;
  if (!product || !product.id || !selectedVariant)
    return <p>Product not found.</p>;
  return (
    <RootLayout>
      <div className='max-w-5xl mx-auto px-4 py-6'>
        <div className='flex flex-col md:flex-row gap-6'>
          {/* Image */}
          <div className='md:w-1/2'>
            <img
              src={selectedVariant.image || product.image}
              alt={product.name}
              className='rounded-xl w-full h-auto border'
            />
          </div>

          {/* Details */}
          <div className='md:w-1/2 space-y-4'>
            <h1 className='text-3xl font-bold'>{product.name}</h1>
            <p className='text-gray-600'>{product.description}</p>

            <p className='text-2xl font-semibold text-blue-600'>
              ₹{selectedVariant.price}
            </p>

            {/* Size Selection */}
            <div>
              <h3 className='font-semibold mb-2'>Select Size:</h3>
              <div className='flex gap-2 flex-wrap'>
                {product.variants?.map((variant, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVariant(variant)}
                    className={`px-4 py-2 rounded-full border ${
                      selectedVariant.size === variant.size
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-black'
                    }`}
                  >
                    {variant.size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className='flex items-center gap-4 mt-4'>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className='px-3 py-1 rounded-full bg-gray-200'
              >
                -
              </button>
              <span className='text-lg'>{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className='px-3 py-1 rounded-full bg-gray-200'
              >
                +
              </button>
            </div>

            {/* Total Price */}
            <div className='mt-2 text-lg font-semibold'>
              Total: ₹
              {selectedVariant && quantity
                ? (selectedVariant.price * quantity).toFixed(2)
                : '0.00'}
            </div>

            {/* Actions */}
            <div className='mt-6'>
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className='w-full border rounded-lg py-3'
              >
                {adding ? 'Adding...' : 'Add to Shine List'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={adding}
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
