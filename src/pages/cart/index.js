'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import RootLayout from '../../components/layouts/RootLayout';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import '../../app/globals.css';

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [comboItems, setComboItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [combos, setCombos] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchAllData();
    }
  }, [userId]);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) setUserId(data.user.id);
  };

  const fetchAllData = async () => {
    // Fetch master tables
    const { data: productsData } = await supabase.from('products').select('*');
    const { data: combosData } = await supabase.from('combos').select('*');

    setProducts(productsData || []);
    setCombos(combosData || []);

    // Fetch cart and combo_cart
    const { data: cartData } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId);
    const { data: comboCartData } = await supabase
      .from('combo_cart')
      .select('*')
      .eq('user_id', userId);

    setCartItems(cartData || []);
    setComboItems(comboCartData || []);
    setLoading(false);
  };

  const getProductById = (id) => products.find((p) => p.id === id);
  const getComboById = (id) => combos.find((c) => c.id === id);

  const updateQuantity = async (itemId, newQty) => {
    if (newQty < 1) return;
    await supabase.from('cart_items').update({ quantity: newQty }).eq('id', itemId);
    fetchAllData();
  };

  const updateComboQuantity = async (itemId, newQty) => {
    if (newQty < 1) return;
    await supabase.from('combo_cart').update({ quantity: newQty }).eq('id', itemId);
    fetchAllData();
  };

  const removeItem = async (itemId) => {
    await supabase.from('cart_items').delete().eq('id', itemId);
    fetchAllData();
  };

  const removeComboItem = async (itemId) => {
    await supabase.from('combo_cart').delete().eq('id', itemId);
    fetchAllData();
  };

  const calculateTotal = () => {
 const productTotal = cartItems.reduce((sum, item) => {
  return sum + item.quantity * item.price;
}, 0);



    const comboTotal = comboItems.reduce((sum, item) => {
      const combo = getComboById(item.combo_id);
      return combo ? sum + item.quantity * combo.price : sum;
    }, 0);

    return productTotal + comboTotal;
  };

  const placeOrder = async () => {
    if (!userId || (cartItems.length === 0 && comboItems.length === 0)) return;

    const orderItems = [
     ...cartItems.map((item) => {
  return {
    product_id: item.product_id,
    name: item.name || '',
    price: item.price || 0,
    quantity: item.quantity,
  };
}),
      ...comboItems.map((item) => {
        const combo = getComboById(item.combo_id);
        return {
          combo_id: item.combo_id,
          name: combo?.name || '',
          price: combo?.price || 0,
          quantity: item.quantity,
        };
      }),
    ];

    // const { error } = await supabase.from('orders').insert([
    //   {
    //     user_id: userId,
    //     items: orderItems,
    //     total: calculateTotal(),
    //   },
    // ]);

    // if (!error) {
    //   // await supabase.from('cart_items').delete().eq('user_id', userId);
    //   // await supabase.from('combo_cart').delete().eq('user_id', userId);
    //   fetchAllData();
    //   alert('Done');
      router.push(`/checkout`);
    // } else {
    //   alert('Failed to place order.');
    // }
  };

  if (loading) {
    return (
      <RootLayout>
        <div className='p-6'>Loading cart...</div>
      </RootLayout>
    );
  }

  return (
    <RootLayout>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        <h1 className='text-3xl font-bold mb-6'>Your Shopping Cart</h1>

        {cartItems.length === 0 && comboItems.length === 0 ? (
          <div className='text-center py-12'>
            <p className='mb-4'>Your cart is empty.</p>
            <button
              type="button"
              onClick={() => router.push('/products')}
              className='bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700'
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className='space-y-4'>
            {/* Product Items */}
            {cartItems.map((item) => {
              const product = getProductById(item.product_id);
              if (!product) return null;
              return (
                <div
                  key={item.id}
                  className='bg-white shadow p-4 rounded flex flex-col md:flex-row md:items-center justify-between'
                >
                  <div className='flex items-center gap-4'>
                    {product.image_url && (
                      <div className='relative w-20 h-20'>
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          sizes='100px'
                          style={{ objectFit: 'cover' }}
                          className='rounded'
                        />
                      </div>
                    )}
                    <div>
                      <h2 className='text-xl font-semibold text-gray-900'>{product.name}</h2>
                      <p className='text-green-600'>₹{item.price} each</p>
                      <p className='text-gray-600'>Total: ₹{item.quantity * item.price}</p>
                    </div>
                  </div>

                  <div className='flex items-center gap-3 mt-4 md:mt-0'>
                    <div className='flex items-center border rounded'>
                      <button
                        type="button"
                        className='px-3 py-1 text-xl font-bold'
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className='px-4'>{item.quantity}</span>
                      <button
                        type="button"
                        className='px-3 py-1 text-xl font-bold'
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className='bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600'
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Combo Items */}
            {comboItems.map((item) => {
              const combo = getComboById(item.combo_id);
              if (!combo) return null;
              return (
                <div
                  key={item.id}
                  className='bg-white shadow p-4 rounded flex flex-col md:flex-row md:items-center justify-between'
                >
                  <div className='flex items-center gap-4'>
                    {combo.image_url && (
                      <div className='relative w-20 h-20'>
                        <Image
                          src={combo.image_url}
                          alt={combo.name}
                          fill
                          sizes='100px'
                          style={{ objectFit: 'cover' }}
                          className='rounded'
                        />
                      </div>
                    )}
                    <div>
                      <h2 className='text-xl font-semibold text-gray-900'>{combo.name}</h2>
                      <p className='text-blue-600'>
                        ₹{combo.price} after {combo.discount_percent}% off
                      </p>
                      <p className='text-gray-600'>
                        Total: ₹{item.quantity * combo.price}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-3 mt-4 md:mt-0'>
                    <div className='flex items-center border rounded'>
                      <button
                        type="button"
                        className='px-3 py-1 text-xl font-bold'
                        onClick={() => updateComboQuantity(item.id, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className='px-4'>{item.quantity}</span>
                      <button
                        type="button"
                        className='px-3 py-1 text-xl font-bold'
                        onClick={() => updateComboQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeComboItem(item.id)}
                      className='bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600'
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}

            <div className='bg-white shadow p-4 rounded text-right text-xl font-bold'>
              Grand Total: ₹{calculateTotal()}
            </div>

            <div className='text-right'>
              <button
                type="button"
                onClick={placeOrder}
                className='bg-blue-600 text-white px-6 py-3 mt-4 rounded hover:bg-blue-700'
              >
                Place Order
              </button>
            </div>
          </div>
        )}
      </div>
    </RootLayout>
  );
}
