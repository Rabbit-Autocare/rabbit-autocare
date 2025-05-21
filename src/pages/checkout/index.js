'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

import '../../app/globals.css';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const productId = searchParams.get('id');
  const comboId = searchParams.get('combo_id');
  const qtyParam = parseInt(searchParams.get('qty')) || 1;

  // Email confirmation states
  const [order, setOrder] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [shippingInfo, setShippingInfo] = useState(null);

  // Core data states
  const [userId, setUserId] = useState(null);
  const [product, setProduct] = useState(null);
  const [combo, setCombo] = useState(null);
  const [products, setProducts] = useState([]);
  const [combos, setCombos] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [comboCartItems, setComboCartItems] = useState([]);
  const [orderProducts, setOrderProducts] = useState([]);
  const [orderCombos, setOrderCombos] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    full_name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    address_type: 'home',
  });
  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Coupon states - Added from your implementation
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (userId) {
      if (productId) fetchSingleProduct();
      else if (comboId) fetchSingleCombo();
      else fetchCartData();
      fetchAddresses();
    }
  }, [userId]);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) setUserId(data.user.id);
  };

  const fetchSingleProduct = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    setProduct(data);
  };

  const fetchSingleCombo = async () => {
    const { data } = await supabase
      .from('combos')
      .select('*')
      .eq('id', comboId)
      .single();
    setCombo(data);
  };

  const fetchCartData = async () => {
    const [cartRes, comboRes, productRes, comboFullRes] = await Promise.all([
      supabase.from('cart_items').select('*').eq('user_id', userId),
      supabase.from('combo_cart').select('*').eq('user_id', userId),
      supabase.from('products').select('*'),
      supabase.from('combos').select('*'),
    ]);
    setCartItems(cartRes.data || []);
    setComboCartItems(comboRes.data || []);
    setProducts(productRes.data || []);
    setCombos(comboFullRes.data || []);
  };

  const fetchAddresses = async () => {
    setAddressLoading(true);
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setAddressLoading(false);
    setAddresses(data || []);
    if (data?.length > 0) {
      setSelectedAddressId(data[0].id);
      setAddressForm({ ...data[0] });
      setIsEditing(false);
    } else {
      setSelectedAddressId(null);
      resetAddressForm();
      setIsEditing(true);
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      full_name: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      postal_code: '',
      address_type: 'home',
    });
  };

  const handleSelectAddress = (address) => {
    setSelectedAddressId(address.id);
    setAddressForm({ ...address });
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const validateAddressForm = () => {
    const { full_name, phone, street, city, state, postal_code } = addressForm;
    if (!full_name || !phone || !street || !city || !state || !postal_code) {
      alert('Please fill all address fields');
      return false;
    }
    return true;
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!validateAddressForm()) return;
    setAddressLoading(true);
    try {
      if (selectedAddressId && !isEditing) {
        await supabase
          .from('addresses')
          .update({ ...addressForm })
          .eq('id', selectedAddressId);
      } else {
        const { data } = await supabase
          .from('addresses')
          .insert([{ ...addressForm, user_id: userId }])
          .select()
          .single();
        setSelectedAddressId(data.id);
      }
      fetchAddresses();
      setIsEditing(false);
    } finally {
      setAddressLoading(false);
    }
  };

  const updateProductQuantity = (id, qty) => {
    if (qty < 1) return;
    setOrderProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantity: qty } : p))
    );
  };

  // Update the getGrandTotal to include coupon discounts
  const getGrandTotal = () => {
    const subtotal = [...orderProducts, ...orderCombos].reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    if (!appliedCoupon) return subtotal;

    const discountAmount = (subtotal * appliedCoupon.discount_percent) / 100;
    return Math.max(0, subtotal - discountAmount);
  };

  const placeOrder = async () => {
    if (!selectedAddressId || orderProducts.length + orderCombos.length === 0)
      return;
    setLoading(true);

    try {
      const items = [
        ...orderProducts.map(({ id, name, price, quantity }) => ({
          product_id: id,
          name,
          price,
          quantity,
        })),
        ...orderCombos.map(({ id, name, price, quantity }) => ({
          combo_id: id,
          name,
          price,
          quantity,
        })),
      ];

      // Calculate discount and prepare order data
      const subtotal = [...orderProducts, ...orderCombos].reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );
      const orderTotal = getGrandTotal();

      const orderData = {
        user_id: userId,
        items,
        total: orderTotal,
        status: 'pending',
        address_id: selectedAddressId,
        // Add coupon information if a coupon is applied
        ...(appliedCoupon && {
          coupon_id: appliedCoupon.id,
          discount_percent: appliedCoupon.discount_percent,
          discount_amount: subtotal - orderTotal,
        }),
      };

      const { data: orderResult, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select();

      if (error) throw error;

      // If order was successful and a coupon was applied, record the usage
      if (appliedCoupon) {
        await supabase.from('user_coupons').insert([
          {
            user_id: userId,
            coupon_id: appliedCoupon.id,
            order_id: orderResult[0].id,
            used_at: new Date().toISOString(),
          },
        ]);
      }

      await supabase.from('cart_items').delete().eq('user_id', userId);
      await supabase.from('combo_cart').delete().eq('user_id', userId);

      router.push('/confirm');
    } catch (error) {
      alert('Error placing order: ' + error.message);
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  useEffect(() => {
    if (product) {
      setOrderProducts([{ ...product, quantity: qtyParam }]);
      setOrderCombos([]);
    } else if (combo) {
      setOrderCombos([{ ...combo, quantity: 1 }]);
      setOrderProducts([]);
    } else {
      const cartMapped = cartItems
        .map((item) => {
          const p = products.find((pr) => pr.id === item.product_id);
          if (!p) return null;
          const variant = p.variants?.find((v) => v.size === item.variant_size);
          if (!variant) return null;
          return {
            id: p.id,
            name: p.name,
            price: variant.price,
            variant_size: variant.size,
            variant_stock: variant.stock,
            quantity: item.quantity,
          };
        })
        .filter(Boolean);

      const comboMapped = comboCartItems
        .map((item) => {
          const c = combos.find((cb) => cb.id === item.combo_id);
          return c ? { ...c, quantity: item.quantity } : null;
        })
        .filter(Boolean);

      setOrderProducts(cartMapped);
      setOrderCombos(comboMapped);
    }
  }, [product, combo, cartItems, comboCartItems, products, combos]);

  // Email confirmation logic
  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    setOrder(orderData);

    // Fetch user email
    const { data: userData } = await supabase
      .from('users') // adjust if your user table is named differently
      .select('email')
      .eq('id', orderData.user_id)
      .single();

    if (userData?.email) {
      setUserEmail(userData.email);
    }

    // Fetch full shipping address
    const { data: addressData } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', orderData.address_id)
      .single();

    setShippingInfo(addressData);
    setLoading(false);
  };

  const handleConfirm = async () => {
    try {
      await fetch('/api/send-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userEmail, // recipient
          email: userEmail, // sender/user
          order, // your order object
          shipping: shippingInfo, // your shipping object
        }),
      });

      router.push('/confirm');
    } catch (err) {
      console.error('Failed to send email:', err);
      router.push('/confirm');
    }
  };

  // Coupon application - Added from your implementation
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
      const cartTotal =
        [...orderProducts, ...orderCombos].reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ) || 0;

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
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponMessage('An error occurred. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div className='max-w-7xl mx-auto p-6'>
      <h1 className='text-3xl font-bold mb-8'>Checkout</h1>

      <div className='grid md:grid-cols-2 gap-6'>
        <div className='bg-white p-4 shadow rounded'>
          <h2 className='text-xl font-semibold mb-2'>Select Address</h2>
          {addressLoading ? (
            <p>Loading...</p>
          ) : (
            addresses.map((addr) => (
              <label
                key={addr.id}
                className={`block p-3 border rounded mb-2 cursor-pointer ${
                  selectedAddressId === addr.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                }`}
              >
                <input
                  type='radio'
                  name='address'
                  checked={selectedAddressId === addr.id}
                  onChange={() => handleSelectAddress(addr)}
                  className='mr-2'
                />
                <span className='font-semibold'>{addr.full_name}</span>
                <div className='text-sm text-gray-600'>
                  {addr.street}, {addr.city}, {addr.state} - {addr.postal_code}
                </div>
                <div className='text-xs text-gray-500'>
                  {addr.phone} | {addr.address_type}
                </div>
              </label>
            ))
          )}

          <button
            onClick={() => {
              resetAddressForm();
              setIsEditing(true);
              setSelectedAddressId(null);
            }}
            className='text-blue-600 underline mb-2'
          >
            Add New Address
          </button>

          {isEditing && (
            <form onSubmit={handleAddressSubmit} className='space-y-2'>
              <input
                type='text'
                name='full_name'
                placeholder='Full Name'
                value={addressForm.full_name}
                onChange={handleInputChange}
                className='w-full border p-2 rounded'
              />
              <input
                type='tel'
                name='phone'
                placeholder='Phone'
                value={addressForm.phone}
                onChange={handleInputChange}
                className='w-full border p-2 rounded'
              />
              <input
                type='text'
                name='street'
                placeholder='Street'
                value={addressForm.street}
                onChange={handleInputChange}
                className='w-full border p-2 rounded'
              />
              <input
                type='text'
                name='city'
                placeholder='City'
                value={addressForm.city}
                onChange={handleInputChange}
                className='w-full border p-2 rounded'
              />
              <input
                type='text'
                name='state'
                placeholder='State'
                value={addressForm.state}
                onChange={handleInputChange}
                className='w-full border p-2 rounded'
              />
              <input
                type='text'
                name='postal_code'
                placeholder='Postal Code'
                value={addressForm.postal_code}
                onChange={handleInputChange}
                className='w-full border p-2 rounded'
              />
              <select
                name='address_type'
                value={addressForm.address_type}
                onChange={handleInputChange}
                className='w-full border p-2 rounded'
              >
                <option value='home'>Home</option>
                <option value='work'>Work</option>
                <option value='other'>Other</option>
              </select>
              <button
                type='submit'
                className='bg-blue-600 text-white py-2 px-4 rounded w-full'
              >
                {addressLoading ? 'Saving...' : 'Save Address'}
              </button>
            </form>
          )}
        </div>

        <div className='bg-white p-4 shadow rounded'>
          <h2 className='text-xl font-semibold mb-2'>Order Summary</h2>
          {orderProducts.map((item) => (
            <div
              key={item.id}
              className='border-b py-2 flex justify-between items-center'
            >
              <div>
                <p className='font-medium'>{item.name}</p>
                <p className='text-sm text-gray-600'>
                  Size: {item.variant_size} | {/*Stock: {item.variant_stock}*/}
                </p>
                <p className='text-sm text-gray-600'>₹{item.price}</p>
              </div>
              <input
                type='number'
                min={1}
                max={item.variant_stock}
                value={item.quantity}
                onChange={(e) =>
                  updateProductQuantity(item.id, parseInt(e.target.value))
                }
                className='w-16 border rounded p-1 text-center'
              />
              <p className='font-semibold'>
                ₹{(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}

          {/* Coupon Section - Added from your implementation */}
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

          {/* Updated Grand Total Display to show discount */}
          <div className='flex justify-between mt-4 font-bold text-lg'>
            <span>Total:</span>
            <div className='text-right'>
              {appliedCoupon && (
                <p className='text-sm font-normal text-gray-500 line-through'>
                  ₹
                  {[...orderProducts, ...orderCombos]
                    .reduce((sum, item) => sum + item.price * item.quantity, 0)
                    .toFixed(2)}
                </p>
              )}
              <span>₹{getGrandTotal().toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={loading}
            className='mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700'
          >
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full shadow-lg'>
            <h3 className='text-xl font-semibold mb-4'>Confirm Order</h3>
            <p className='mb-6'>Are you sure you want to place this order?</p>
            <div className='flex justify-end space-x-4'>
              <button
                onClick={() => setShowConfirmModal(false)}
                className='px-4 py-2 rounded border border-gray-400 hover:bg-gray-100'
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  placeOrder();
                  handleConfirm();
                }}
                className='px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700'
              >
                Yes, Place Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
