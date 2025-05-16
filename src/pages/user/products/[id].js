'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import Navbar from '../../../components/UserNavbar';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

export default function ProductDetailPage({ params }) {
  const router = useRouter();
 const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [userId, setUserId] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchProduct();
    getUser();
  }, [id]);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) setUserId(data.user.id);
  };

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (!error) {
      setProduct(data);
      fetchRelated(data.category, data.id);
      checkWishlist(data.id);
    }
  };

  const fetchRelated = async (category, currentId) => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .neq('id', currentId)
      .limit(3);

    setRelated(data);
  };

  const checkWishlist = async (productId) => {
    if (!userId) return;
    const { data } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    setIsWishlisted(!!data);
  };

  const toggleWishlist = async () => {
    if (!userId || !product) return;

    if (isWishlisted) {
      await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', product.id);
    } else {
      await supabase
        .from('wishlist')
        .insert({ user_id: userId, product_id: product.id });
    }
    setIsWishlisted(!isWishlisted);
  };

 const addToCart = async () => {
  if (!product || !userId) return;
  setAdding(true);

  // Check if product already exists in cart
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', product.id)
    .single();

  let error;

  if (existingItem) {
    // Update quantity if item already exists
    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity: existingItem.quantity + quantity })
      .eq('id', existingItem.id);

    error = updateError;
  } else {
    // Insert new item with product name, price, image
    const { error: insertError } = await supabase.from('cart_items').insert([
      {
        user_id: userId,
        product_id: product.id,
        quantity,
        name: product.name,
        price: product.price,
        image: product.image,
      },
    ]);

    error = insertError;
  }

  setAdding(false);

  if (error) {
    alert('Failed to add to cart');
  } else {
    alert('Added to cart!');
  }
};


  if (!product) return <div className="p-6">Loading product details...</div>;

  return (<>
 
  <div >

     <Navbar />
      <main className="flex-1 ml-0 md:ml-60 p-6">
        <button
          className="mb-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          onClick={() => router.back()}
        >
          ← Back
        </button>

        <div className="bg-white shadow-md rounded-lg p-6 max-w-4xl mx-auto">
          {product.image && (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-64 object-cover rounded"
            />
          )}

          <div className="flex items-center justify-between mt-4">
            <h1 className="text-4xl font-bold">{product.name}</h1>
            <button onClick={toggleWishlist}>
              {isWishlisted ? (
                <FaHeart className="text-red-500 text-2xl" />
              ) : (
                <FaRegHeart className="text-gray-500 text-2xl" />
              )}
            </button>
          </div>

          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full mt-2">
            {product.category}
          </span>

          <p className="text-green-700 text-2xl font-semibold mt-3">₹{product.price}</p>
          <p className="text-sm mt-1">
            {product.stock && product.stock > 0 ? (
              <span className="text-green-600">In Stock</span>
            ) : (
              <span className="text-red-500">Out of Stock</span>
            )}
          </p>

          <p className="text-gray-700 mt-4">{product.description}</p>

          {/* Quantity + Price + Add to Cart */}
          <div className="flex items-center mt-6 gap-6">
            <input
              type="number"
              min="1"
              max={product.stock || 99}
              value={quantity}
              onChange={(e) => {
                let val = parseInt(e.target.value);
                if (isNaN(val)) val = 1;
                val = Math.max(1, val);
                setQuantity(val);
              }}
              className="w-20 border px-3 py-2 rounded"
              disabled={!product.stock}
            />

            <div className="flex flex-col text-sm">
              <span className="font-semibold">{product.name}</span>
              <span>Price per unit: ₹{product.price}</span>
              <span>Total: ₹{(product.price * quantity).toFixed(2)}</span>
            </div>

            <button
              onClick={addToCart}
              disabled={adding || !product.stock}
              className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 transition disabled:opacity-50"
            >
              {adding ? 'Adding...' : 'Add to Cart'}
            </button>
           <button
  onClick={() => router.push(`/user/checkout?id=${product.id}&qty=${quantity}`)}
  disabled={!product.stock || product.stock === 0}
  className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50"
>
  Buy Now
</button>


          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-4">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {related.map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push(`/user/products/${item.id}`)}
                  className="bg-white p-4 shadow rounded hover:shadow-md cursor-pointer"
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-40 w-full object-cover rounded"
                    />
                  )}
                  <h3 className="mt-2 font-semibold">{item.name}</h3>
                  <p className="text-green-600 font-medium">₹{item.price}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
     </>
  );
}
