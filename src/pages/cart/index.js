'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import RootLayout from '../../components/layouts/RootLayout';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import '../../app/globals.css';

/**
 * Shopping Cart Page
 * Displays cart items, quantity controls, and coupon application
 * Calculates subtotals, discounts and allows proceeding to checkout
 */
export default function CartPage() {
  // Cart data state
  const [cartItems, setCartItems] = useState([]);
  const [comboItems, setComboItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [combos, setCombos] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const router = useRouter();

  // Get current user on component mount
  useEffect(() => {
    getUser();
  }, []);

  // Fetch cart data when user ID is available
  useEffect(() => {
    if (userId) {
      fetchAllData();
    }
  }, [userId]);

  // Load any previously applied coupon from localStorage
  useEffect(() => {
    const savedCoupon = localStorage.getItem('appliedCoupon');
    if (savedCoupon) {
      try {
        const coupon = JSON.parse(savedCoupon);
        setAppliedCoupon(coupon);
        setCouponCode(coupon.code);
        setCouponMessage('Coupon applied successfully!');
      } catch (error) {
        console.error('Error parsing saved coupon:', error);
      }
    }
  }, []);

  /**
   * Fetches the current authenticated user
   */
  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) setUserId(data.user.id);
  };

  /**
   * Fetches all necessary data for the cart page:
   * - Products catalog
   * - Combo deals
   * - User's cart items
   * - User's combo cart items
   */
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

  /**
   * Helper function to get product details by ID
   *
   * @param {string} id - Product ID
   * @returns {Object|null} Product object or null if not found
   */
  const getProductById = (id) => products.find((p) => p.id === id);

  /**
   * Helper function to get combo details by ID
   *
   * @param {string} id - Combo ID
   * @returns {Object|null} Combo object or null if not found
   */
  const getComboById = (id) => combos.find((c) => c.id === id);

  /**
   * Updates the quantity of a product in the cart
   *
   * @param {string} itemId - Cart item ID
   * @param {number} newQty - New quantity
   */
  const updateQuantity = async (itemId, newQty) => {
    if (newQty < 1) return;
    await supabase
      .from('cart_items')
      .update({ quantity: newQty })
      .eq('id', itemId);
    fetchAllData();
  };

  /**
   * Updates the quantity of a combo in the cart
   *
   * @param {string} itemId - Combo cart item ID
   * @param {number} newQty - New quantity
   */
  const updateComboQuantity = async (itemId, newQty) => {
    if (newQty < 1) return;
    await supabase
      .from('combo_cart')
      .update({ quantity: newQty })
      .eq('id', itemId);
    fetchAllData();
  };

  /**
   * Removes a product from cart
   *
   * @param {string} itemId - Cart item ID
   */
  const removeItem = async (itemId) => {
    await supabase.from('cart_items').delete().eq('id', itemId);
    fetchAllData();
  };

  /**
   * Removes a combo from cart
   *
   * @param {string} itemId - Combo cart item ID
   */
  const removeComboItem = async (itemId) => {
    await supabase.from('combo_cart').delete().eq('id', itemId);
    fetchAllData();
  };

  /**
   * Calculates total price of all items in cart
   *
   * @returns {number} Total price
   */
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

  /**
   * Calculates cart subtotal before any discounts
   *
   * @returns {number} Cart subtotal
   */
  const getCartTotal = () => {
    return (
      cartItems.reduce((total, item) => {
        const product = products.find((p) => p.id === item.product_id);
        if (!product) return total;

        const variant = product.variants?.find(
          (v) => v.size === item.variant_size
        );
        if (!variant) return total;

        return total + variant.price * item.quantity;
      }, 0) +
      comboItems.reduce((total, item) => {
        const combo = combos.find((c) => c.id === item.combo_id);
        if (!combo) return total;

        return total + combo.price * item.quantity;
      }, 0)
    );
  };

  /**
   * Calculates final total with discount if coupon applied
   *
   * @returns {number} Final total
   */
  const getGrandTotal = () => {
    const subtotal = getCartTotal();

    if (!appliedCoupon) return subtotal;

    const discountAmount = (subtotal * appliedCoupon.discount_percent) / 100;
    return Math.max(0, subtotal - discountAmount);
  };

  /**
   * Creates order and proceeds to checkout
   */
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

    const { error } = await supabase.from('orders').insert([
      {
        user_id: userId,
        items: orderItems,
        total: calculateTotal(),
      },
    ]);

    if (!error) {
      // Proceed to checkout flow
      router.push(`/checkout`);
    } else {
      alert('Failed to place order.');
    }
  };

  /**
   * Validates and applies a coupon code
   * Performs multiple validation checks before applying discount
   */
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponMessage('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponMessage('');

    try {
      // First, check if the coupon exists and is active
      const { data: coupons, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .limit(1);

      if (couponError) throw couponError;

      if (!coupons || coupons.length === 0) {
        setCouponMessage('Invalid coupon code');
        return;
      }

      const coupon = coupons[0];

      // Check if coupon is expired
      if (!coupon.is_permanent && new Date(coupon.expiry_date) < new Date()) {
        setCouponMessage('Coupon has expired');
        return;
      }

      // Calculate cart total
      const cartTotal = getCartTotal();

      // Check if minimum order value is met
      if (cartTotal < coupon.min_order_amount) {
        setCouponMessage(
          `Minimum order amount of ₹${coupon.min_order_amount} required`
        );
        return;
      }

      // Check if user has already used this coupon
      const { data: usedCoupon, error: usedError } = await supabase
        .from('user_coupons')
        .select('*')
        .eq('user_id', userId)
        .eq('coupon_id', coupon.id)
        .limit(1);

      if (usedError) throw usedError;

      if (usedCoupon && usedCoupon.length > 0) {
        setCouponMessage('You have already used this coupon');
        return;
      }

      // If all checks pass, apply the coupon
      setAppliedCoupon(coupon);
      setCouponMessage('Coupon applied successfully!');

      // Store the applied coupon in localStorage for checkout page
      localStorage.setItem('appliedCoupon', JSON.stringify(coupon));
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponMessage('An error occurred. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  // Automatically validate coupon on cart changes
  useEffect(() => {
    // Skip validation if no coupon is applied
    if (!appliedCoupon) return;

    // Validate minimum order value whenever cart items change
    const cartTotal = getCartTotal();
    if (cartTotal < appliedCoupon.min_order_amount) {
      // Remove invalid coupon
      setAppliedCoupon(null);
      setCouponCode('');
      setCouponMessage(
        `Coupon removed: Total amount below minimum requirement of ₹${appliedCoupon.min_order_amount}`
      );
      localStorage.removeItem('appliedCoupon');
    }
  }, [cartItems, comboItems, products, combos]);

  // Display loading state while data is being fetched
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
              type='button'
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
                      <h2 className='text-xl font-semibold text-gray-900'>
                        {product.name}
                      </h2>
                      <p className='text-green-600'>₹{item.price} each</p>
                      <p className='text-gray-600'>
                        Total: ₹{item.quantity * item.price}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-3 mt-4 md:mt-0'>
                    <div className='flex items-center border rounded'>
                      <button
                        type='button'
                        className='px-3 py-1 text-xl font-bold'
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        −
                      </button>
                      <span className='px-4'>{item.quantity}</span>
                      <button
                        type='button'
                        className='px-3 py-1 text-xl font-bold'
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                    <button
                      type='button'
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
                      <h2 className='text-xl font-semibold text-gray-900'>
                        {combo.name}
                      </h2>
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
                        type='button'
                        className='px-3 py-1 text-xl font-bold'
                        onClick={() =>
                          updateComboQuantity(item.id, item.quantity - 1)
                        }
                      >
                        −
                      </button>
                      <span className='px-4'>{item.quantity}</span>
                      <button
                        type='button'
                        className='px-3 py-1 text-xl font-bold'
                        onClick={() =>
                          updateComboQuantity(item.id, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                    <button
                      type='button'
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

            {/* Coupon Section */}
            <div className='mt-4 pt-4 border-t'>
              <h3 className='font-medium mb-2'>Apply Coupon</h3>
              <div className='flex gap-2'>
                <input
                  type='text'
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className='flex-grow border p-2 rounded'
                  placeholder='Enter coupon code'
                  disabled={!!appliedCoupon}
                />
                {appliedCoupon ? (
                  <button
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponCode('');
                      setCouponMessage('');
                      localStorage.removeItem('appliedCoupon');
                    }}
                    className='bg-red-500 text-white px-3 py-1 rounded'
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={applyCoupon}
                    disabled={couponLoading}
                    className='bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:opacity-50'
                  >
                    {couponLoading ? 'Checking...' : 'Apply'}
                  </button>
                )}
              </div>

              {couponMessage && (
                <p
                  className={`text-sm mt-1 ${
                    appliedCoupon ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {couponMessage}
                </p>
              )}

              {appliedCoupon && (
                <div className='bg-green-50 p-2 rounded mt-2 text-sm'>
                  <p>
                    <span className='font-medium'>{appliedCoupon.code}</span>{' '}
                    applied - {appliedCoupon.discount_percent}% off
                  </p>
                  <p className='text-xs text-gray-600'>
                    {appliedCoupon.description}
                  </p>
                </div>
              )}
            </div>

            {/* Updated Total Display to show discount */}
            <div className='flex justify-between mt-4 font-bold text-lg'>
              <span>Total:</span>
              <div className='text-right'>
                {appliedCoupon && (
                  <p className='text-sm font-normal text-gray-500 line-through'>
                    ₹{getCartTotal().toFixed(2)}
                  </p>
                )}
                <span>₹{getGrandTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className='text-right'>
              <button
                type='button'
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
