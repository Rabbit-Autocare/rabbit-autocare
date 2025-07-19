'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
const supabase = createSupabaseBrowserClient();
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

import '@/app/globals.css';
import { calculateCartTotals } from "@/utils/cartTransformUtils";
import PriceSummary from '@/components/cart/PriceSummary';
import AddressSection from '@/components/Address/AddressSection';
import OrderSummary from '@/components/checkout-order/OrderSummary';
import {
  transformCartForCheckout,
  calculateOrderTotals,
} from '@/lib/utils/cartTransformUtils';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true); // Already loaded
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

// const getVariantIdsFromItem = async (item) => {
//   if (item.type === 'product' && item.variant_id) {
//     return [{ variant_id: item.variant_id, quantity: item.quantity }];
//   }

//   if (item.type === 'kit' || item.type === 'combo') {
//     const sourceTable = item.type === 'kit' ? 'kit_products' : 'combo_products';
//     const sourceIdColumn = item.type === 'kit' ? 'kit_id' : 'combo_id';
//     const sourceId = item.type === 'kit' ? item.kit_id : item.combo_id;

//     const { data: relatedItems, error } = await supabase
//       .from(sourceTable)
//       .select('variant_id, quantity')
//       .eq(sourceIdColumn, sourceId);

//     if (error) {
//       console.error(`Error fetching related items for ${item.type}:`, error);
//       return [];
//     }

//     return relatedItems.map((related) => ({
//       variant_id: related.variant_id,
//       quantity: related.quantity * item.quantity,
//     }));
//   }
//   return [];
// };

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { cartItems, coupon, loading: cartLoading, clearCoupon, error: cartError, retryCartFetch } = useCart();
  const { user } = useAuth();

  const id = searchParams.get('id');
  const productId = searchParams.get('id');
  const comboId = searchParams.get('combo_id');
  const qtyParam = Number.parseInt(searchParams.get('qty')) || 1;
const formatPrice = (amount) => `₹${Number(amount).toFixed(0)}`;

  const [userId, setUserId] = useState(null);
  const [product, setProduct] = useState(null);
  const [combo, setCombo] = useState(null);
  const [transformedItems, setTransformedItems] = useState([]);
  const [selectedShippingAddressId, setSelectedShippingAddressId] =
    useState(null);
  const [selectedBillingAddressId, setSelectedBillingAddressId] =
    useState(null);
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [loading, setLoading] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [orderTotals, setOrderTotals] = useState({
  subtotal: 0,
  discount: 0,
  grandTotal: 0,
  itemCount: 0,
  totalQuantity: 0,
});

  // Move function definitions here
  const fetchSingleProduct = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (data) {
        const transformedProduct = {
          id: `direct-${data.id}`,
          type: 'product',
          product_id: data.id,
          product_code: data.product_code,
          name: data.name,
          description: data.description,
          main_image_url: data.main_image_url,
          images: data.images,
          variant: null,
          variant_display_text: 'Default',
          base_price: data.price,
          quantity: qtyParam,
          total_price: data.price * qtyParam,
          is_microfiber: data.is_microfiber,
          key_features: data.key_features,
          taglines: data.taglines,
          category_name: data.category_name,
        };

        setTransformedItems([transformedProduct]);
      }
    } catch (error) {
      console.error('Error fetching single product:', error);
    } finally {
      setLoading(false);
    }
  }, [productId, qtyParam]);

  const fetchSingleCombo = useCallback(async () => {
  try {
    const { data: combo } = await supabase
      .from('combos')
      .select('*')
      .eq('id', comboId)
      .single();

    if (!combo) return;

    setCombo(combo);

    const { data: comboProducts } = await supabase
      .from('combo_products')
      .select(`
        *,
        product:products(*),
        variant:product_variants(variant_code)
      `)
      .eq('combo_id', combo.id);

    if (!comboProducts) {
      console.error('No combo products found');
      return;
    }

    const transformedCombo = {
      id: `direct-${combo.id}`,
      type: 'combo',
      combo_id: combo.id,
      name: combo.name,
      description: combo.description,
      main_image_url: combo.main_image_url,
      images: combo.images,
      price: combo.price,
      original_price: combo.original_price,
      discount_percentage: combo.discount_percent,
      quantity: 1,
      total_price: combo.price,
      included_products: comboProducts.map((cp) => ({
        product_id: cp.product_id,
        product_name: cp.product?.name,
        product_code: cp.product?.product_code,
        variant_id: cp.variant_id,
        variant_code: cp.variant?.variant_code || '', // ✅ directly fetched
        quantity: cp.quantity,
      })),
      included_variants: [],
    };

    setTransformedItems([transformedCombo]);
  } catch (error) {
    console.error('Error in fetchSingleCombo:', error);
  } finally {
    setLoading(false);
  }
}, [comboId]);

  const transformCartData = useCallback(async () => {
    if (!cartItems || cartItems.length === 0) {
      setTransformedItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const transformed = await transformCartForCheckout(cartItems, userId);
      setTransformedItems(transformed);
    } catch (error) {
      console.error('Error transforming cart data:', error);
      setTransformedItems([]);
    } finally {
      setLoading(false);
    }
  }, [cartItems, userId]);

  useEffect(() => {
    if (user) {
      setUserId(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (userId) {
      if (productId) fetchSingleProduct();
      else if (comboId) fetchSingleCombo();
      else transformCartData();
    }
  }, [userId, cartItems, productId, comboId, fetchSingleProduct, fetchSingleCombo, transformCartData]);

  // Recalculate totals when items or coupon change
  useEffect(() => {
    if (transformedItems.length > 0) {
     const summary = calculateCartTotals(transformedItems, coupon);
setOrderTotals({
  subtotal: summary.subtotal,
  discount: summary.discount,
  grandTotal: summary.finalTotal,
  itemCount: transformedItems.length,
  totalQuantity: transformedItems.reduce((sum, i) => sum + (i.quantity || 1), 0),
});

    }
  }, [transformedItems, coupon]);

  // Recalculate delivery charge when address or cart total changes
  useEffect(() => {
    const calculateDeliveryCharge = async () => {
      const cartValue = orderTotals.subtotal - (orderTotals.discount || 0);

      if (cartValue > 499) {
        setDeliveryCharge(0);
        return;
      }

      if (!selectedShippingAddressId) {
        setDeliveryCharge(0); // No address, no charge yet
        return;
      }

      try {
        const { data: address, error } = await supabase
          .from('addresses')
          .select('state')
          .eq('id', selectedShippingAddressId)
          .single();

        if (error || !address) {
          console.error('Could not fetch address for delivery charge calc:', error);
          setDeliveryCharge(99); // Default to higher charge on error
          return;
        }

        const state = address.state.toLowerCase().trim();
        const specialStates = ['haryana', 'delhi', 'chandigarh'];

        if (specialStates.includes(state)) {
          setDeliveryCharge(59);
        } else {
          setDeliveryCharge(99);
        }
      } catch (e) {
        console.error('Exception during delivery charge calc:', e);
        setDeliveryCharge(99); // Default on exception
      }
    };

    calculateDeliveryCharge();
  }, [selectedShippingAddressId, orderTotals.subtotal, orderTotals.discount]);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) setUserId(data.user.id);
  };
useEffect(() => {
  if (transformedItems.length > 0) {
    const summary = calculateCartTotals(transformedItems, coupon);
    setOrderTotals({
      subtotal: summary.subtotal,
      discount: summary.discount,
      grandTotal: summary.finalTotal,
      itemCount: transformedItems.length,
      totalQuantity: transformedItems.reduce((sum, i) => sum + (i.quantity || 1), 0),
    });
  }
}, [transformedItems, coupon]);


  const updateItemQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    setTransformedItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: newQuantity,
              total_price: item.price * newQuantity,
            }
          : item
      )
    );
  };

 const handlePlaceOrder = async () => {
  if (
    !selectedShippingAddressId ||
    (!useSameAddress && !selectedBillingAddressId) ||
    transformedItems.length === 0
  ) {
    alert(
      'Please select both shipping and billing addresses and ensure you have items in your cart.'
    );
    return;
  }

  setLoading(true);
  setPaymentProcessing(true);
  setPaymentError(null);

  try {
    const { data: shippingAddress, error: shippingError } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', selectedShippingAddressId)
      .single();

    if (shippingError)
      throw new Error(`Failed to fetch shipping address: ${shippingError.message}`);

    const billingAddressId = useSameAddress
      ? selectedShippingAddressId
      : selectedBillingAddressId;

    const { data: billingAddress, error: billingError } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', billingAddressId)
      .single();

    if (billingError)
      throw new Error(`Failed to fetch billing address: ${billingError.message}`);

    if (!user) throw new Error('User not authenticated');

    const date = new Date();
    const orderNumber = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
      date.getDate()
    ).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // ✅ Calculate grand total manually
    const calculatedSubtotal = transformedItems.reduce((sum, item) => {
      const unit = item.price || 0;
      const qty = item.quantity || 1;
      const total = item.total_price ?? unit * qty;
      return sum + total;
    }, 0);

    const finalAmount = calculatedSubtotal - (orderTotals.discount || 0) + (deliveryCharge || 0);

    // Debug (optional)
    console.log("Final payable amount:", finalAmount);

    const orderData = {
      order_number: orderNumber,
      user_id: userId,
      shipping_address_id: selectedShippingAddressId,
      billing_address_id: billingAddressId,
      user_info: {
        email: user.email,
        shipping_address: shippingAddress,
        billing_address: billingAddress,
      },
      items: transformedItems.map((item) => ({
        ...item,
        main_image_url: item.main_image_url || null,
      })),
      subtotal: calculatedSubtotal,
      discount_amount: orderTotals.discount || 0,
      total: finalAmount,
      delivery_charge: deliveryCharge,
      coupon_id: coupon?.id || null,
      status: 'pending',
      payment_status: 'pending',
      created_at: new Date().toISOString(),
    };

    const razorpayOrderRes = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: finalAmount,
        currency: 'INR',
        receipt: orderNumber,
      }),
    });

    const razorpayOrderData = await razorpayOrderRes.json();
    console.log('Razorpay order API response:', razorpayOrderData);

    if (!razorpayOrderData?.success || !razorpayOrderData?.id) {
      throw new Error(
        razorpayOrderData?.error?.message ||
          'Failed to create payment order. Please try again.'
      );
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: razorpayOrderData.amount,
      currency: razorpayOrderData.currency,
      name: 'Rabbit Auto Care',
      description: `Order #${orderNumber}`,
      order_id: razorpayOrderData.id,
      prefill: {
        name: user?.full_name || '',
        email: user?.email || '',
        contact: shippingAddress?.phone || '',
      },
      theme: { color: '#601E8D' },
      handler: async function (response) {
        setPaymentProcessing(true);
        setLoading(true);
        setPaymentError(null);
        try {
          // 1. Verify payment
          const verificationRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response }),
          });
          const verificationData = await verificationRes.json();
          if (!verificationData.success) {
            setPaymentError('Payment verification failed. Please contact support.');
            setPaymentProcessing(false);
            setLoading(false);
            return;
          }

          // 2. Complete order
          const completeOrderRes = await fetch('/api/orders/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...orderData,
              payment_status: 'paid',
              razorpay_order_id: razorpayOrderData.id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const completeOrderData = await completeOrderRes.json();
          if (!completeOrderData.success || !completeOrderData.order_id) {
            setPaymentError('Order creation failed after payment. Please contact support.');
            setPaymentProcessing(false);
            setLoading(false);
            return;
          }

          // 3. Clear cart (Supabase and context)
          await supabase.from('cart_items').delete().eq('user_id', userId);
          if (coupon) clearCoupon();
          if (typeof retryCartFetch === 'function') {
            setTimeout(() => {
              retryCartFetch().catch(console.error);
            }, 1000);
          }

          // 4. Hard redirect to confirmation page
          const redirectUrl = `/order-confirmation/${completeOrderData.order_id}?success=true`;
          window.location.replace(redirectUrl);
        } catch (error) {
          setPaymentError('An error occurred after payment. Please contact support.');
          setPaymentProcessing(false);
          setLoading(false);
        }
      },
      modal: {
        ondismiss: function () {
          setPaymentProcessing(false);
          setLoading(false);
          setPaymentError('Payment was cancelled.');
        },
      },
    };

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      throw new Error('Failed to load Razorpay SDK. Please try again later.');
    }

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      setPaymentProcessing(false);
      setLoading(false);
      setPaymentError(`Payment failed: ${response.error.description}`);
    });
    rzp.open();
  } catch (error) {
    console.error('Order creation error:', error);
    setPaymentError(
      error.message || 'There was an error creating your order. Please try again.'
    );
    setLoading(false);
    setPaymentProcessing(false);
  }
};

  // Add robust redirect fallback using localStorage
  useEffect(() => {
    const redirectUrl = localStorage.getItem('rbbit_redirect');
    console.log('[Checkout Fallback] On mount, localStorage rbbit_redirect:', redirectUrl);
    if (redirectUrl) {
      localStorage.removeItem('rbbit_redirect');
      console.log('[Checkout Fallback] Redirecting to:', redirectUrl);
      router.push(redirectUrl);
    }
    // Hard fallback: if stuck, check again after 5 seconds
    const timeout = setTimeout(() => {
      const retryUrl = localStorage.getItem('rbbit_redirect');
      console.log('[Checkout Fallback] Timeout check, localStorage rbbit_redirect:', retryUrl);
      if (retryUrl) {
        localStorage.removeItem('rbbit_redirect');
        console.log('[Checkout Fallback] Timeout redirecting to:', retryUrl);
        router.push(retryUrl);
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [router]);

  // Add fallback manual redirect button if stuck
  const [showManualRedirect, setShowManualRedirect] = useState(false);
  const [manualRedirectUrl, setManualRedirectUrl] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const url = localStorage.getItem('rbbit_redirect');
      if (url) {
        setManualRedirectUrl(url);
        setShowManualRedirect(true);
      }
    }, 10000); // 10 seconds
    return () => clearTimeout(timer);
  }, []);

  if (cartError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded p-8 text-center">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Cart Error</h2>
          <p className="text-red-600 mb-6">There was a problem loading your cart: {cartError}</p>
          <button
            onClick={retryCartFetch}
            className="bg-[#601E8D] hover:bg-[#4a1770] text-white px-6 py-2 rounded font-semibold shadow-sm transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (cartLoading || loading) {
    return (
      <div className='min-h-screen bg-white'>
        <div className='container mx-auto px-4 py-8'>
          <div className='flex items-center justify-center h-96'>
            <div className='text-center'>
              <div className='relative'>
                <div className='w-20 h-20 mx-auto mb-6'>
                  <div className='absolute inset-0 bg-[#601E8D] rounded-full animate-pulse'></div>
                  <div className='absolute inset-2 bg-white rounded-full flex items-center justify-center'>
                    <div className='w-8 h-8 border-4 border-[#601E8D] border-t-transparent rounded-full animate-spin'></div>
                  </div>
                </div>
              </div>
              <h2 className='text-2xl font-semibold text-black mb-2'>
                Loading Checkout
              </h2>
              <p className='text-gray-600'>Preparing your order details...</p>
              {showManualRedirect && manualRedirectUrl && (
                <div className="mt-8">
                  <button
                    className="bg-[#601E8D] hover:bg-[#4a1770] text-white px-6 py-3 rounded font-semibold shadow-sm transition-all duration-200"
                    onClick={() => window.location.replace(manualRedirectUrl)}
                  >
                    Go to Order Confirmation
                  </button>
                  <p className="text-gray-500 mt-2">If you are not redirected automatically, click the button above to view your order confirmation.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <>
      <div className='min-h-screen bg-white'>
        {/* Header Section */}
        <div className='bg-black border-b border-gray-200'>
          <div className='container mx-auto px-4 py-8'>
            <div className='text-center text-white'>
              <div className='flex items-center justify-center gap-4 mb-4'>
                <div className='w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20'>
                  <span className='text-2xl'>🛒</span>
                </div>
                <h1 className='text-4xl md:text-5xl font-bold'>Checkout</h1>
              </div>
              <p className='text-gray-300 text-lg max-w-2xl mx-auto'>
                Complete your purchase securely
              </p>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className='container mx-auto px-4 py-4 border-b border-gray-100'>
          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <button
              onClick={() => router.push('/shop')}
              className='hover:text-[#601E8D] transition-colors'
            >
              Shop
            </button>
            <span className='text-gray-400'>→</span>
            <button
              onClick={() => router.push('/cart')}
              className='hover:text-[#601E8D] transition-colors'
            >
              Cart
            </button>
            <span className='text-gray-400'>→</span>
            <span className='text-[#601E8D] font-medium'>Checkout</span>
          </div>
        </div>

        <div className='container mx-auto px-4 pb-12'>
          {transformedItems.length === 0 ? (
            <div className='max-w-2xl mx-auto mt-12'>
              <div className='bg-white rounded-[4px] shadow-sm p-12 text-center border border-gray-200'>
                <div className='w-24 h-24 mx-auto mb-6 bg-gray-50 rounded-full flex items-center justify-center border border-gray-200'>
                  <span className='text-4xl'>🛒</span>
                </div>
                <h2 className='text-3xl font-bold text-black mb-4'>
                  Your Cart is Empty
                </h2>
                <p className='text-gray-600 text-lg mb-8 leading-relaxed'>
                  Looks like you haven&apos;t added any items to your cart yet.
                  Discover our amazing products and start shopping!
                </p>
                <button
                  onClick={() => router.push('/shop')}
                  className='bg-[#601E8D] hover:bg-[#4a1770] text-white px-8 py-4 rounded-[4px] font-semibold text-lg shadow-sm hover:shadow-md transition-all duration-300'
                >
                  <span className='flex items-center gap-3'>
                    <span>🛍️</span>
                    <span>Continue Shopping</span>
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className='max-w-7xl mx-auto'>
              {/* Progress Indicator */}
              <div className='mb-8 mt-8'>
                <div className='bg-white rounded-[4px] p-6 shadow-sm border border-gray-200'>
                  <div className='flex items-center justify-center gap-8'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-[#601E8D] rounded-full flex items-center justify-center text-white font-bold'>
                        ✓
                      </div>
                      <span className='font-medium text-gray-700'>
                        Cart Review
                      </span>
                    </div>
                    <div className='w-16 h-1 bg-[#601E8D] rounded-full'></div>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-[#601E8D] rounded-full flex items-center justify-center text-white font-bold'>
                        2
                      </div>
                      <span className='font-medium text-[#601E8D]'>
                        Checkout
                      </span>
                    </div>
                    <div className='w-16 h-1 bg-gray-200 rounded-full'></div>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold'>
                        3
                      </div>
                      <span className='font-medium text-gray-500'>
                        Confirmation
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Checkout Content */}
              <div className='grid lg:grid-cols-5 gap-8'>
                {/* Address Section - Left Side */}
                <div className='lg:col-span-3'>
                  {/* Shipping Address Section */}
                  <div className='bg-white rounded-[4px] shadow-sm border border-gray-200 overflow-hidden mb-6'>
                    <div className='bg-black p-6 text-white border-b border-gray-200'>
                      <h2 className='text-2xl font-bold flex items-center gap-3'>
                        <span className='text-2xl'>📦</span>
                        Shipping Address
                      </h2>
                      <p className='text-gray-300 mt-2'>
                        Where should we deliver your order?
                      </p>
                    </div>
                    <div className='p-6'>
                      <AddressSection
                        userId={userId}
                        selectedAddressId={selectedShippingAddressId}
                        setSelectedAddressId={setSelectedShippingAddressId}
                      />
                    </div>
                  </div>

                  {/* Same as Shipping Checkbox */}
                  <div className='bg-white rounded-[4px] shadow-sm border border-gray-200 p-4 mb-6'>
                    <label className='flex items-center gap-3 cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={useSameAddress}
                        onChange={(e) => setUseSameAddress(e.target.checked)}
                        className='w-5 h-5 text-[#601E8D] border-gray-300 rounded-[4px] focus:ring-[#601E8D]'
                      />
                      <span className='text-gray-700 font-medium'>
                        Billing address is same as shipping address
                      </span>
                    </label>
                  </div>

                  {/* Billing Address Section */}
                  {!useSameAddress && (
                    <div className='bg-white rounded-[4px] shadow-sm border border-gray-200 overflow-hidden'>
                      <div className='bg-black p-6 text-white border-b border-gray-200'>
                        <h2 className='text-2xl font-bold flex items-center gap-3'>
                          <span className='text-2xl'>📝</span>
                          Billing Address
                        </h2>
                        <p className='text-gray-300 mt-2'>
                          Where should we send the invoice?
                        </p>
                      </div>
                      <div className='p-6'>
                        <AddressSection
                          userId={userId}
                          selectedAddressId={selectedBillingAddressId}
                          setSelectedAddressId={setSelectedBillingAddressId}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Summary - Right Side */}
                <div className='lg:col-span-2'>
                  <div className='sticky top-6'>
                    {/* Payment Error Alert */}
                    {paymentError && (
                      <div className='mb-6 bg-red-50 border border-red-200 rounded-[4px] p-4'>
                        <div className='flex items-start gap-3'>
                          <div className='text-red-500 text-xl mt-0.5'>⚠️</div>
                          <div>
                            <h4 className='font-medium text-red-700'>
                              Payment Issue
                            </h4>
                            <p className='text-red-600 text-sm mt-1'>
                              {paymentError}
                            </p>
                            <div className='mt-3'>
                              <button
                                onClick={() => setPaymentError(null)}
                                className='text-sm bg-white border border-red-300 hover:bg-red-50 text-red-700 px-3 py-1 rounded-sm mr-2'
                              >
                                Dismiss
                              </button>
                              <button
                                onClick={() => window.location.reload()}
                                className='text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-sm'
                              >
                                Try Again
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Processing Indicator */}
                    {paymentProcessing && (
                      <div className='mb-6 bg-blue-50 border border-blue-200 rounded-[4px] p-4'>
                        <div className='flex items-center gap-3'>
                          <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600'></div>
                          <p className='text-blue-700 font-medium'>
                            Processing your payment... Please don&apos;t close
                            this page.
                          </p>
                        </div>
                      </div>
                    )}

                   <div className='lg:col-span-2'>
  <div className='sticky top-6'>
    {/* Existing summary */}
    <OrderSummary
      items={transformedItems}
      updateItemQuantity={updateItemQuantity}
      coupon={coupon}
      orderTotals={orderTotals}
      deliveryCharge={deliveryCharge}
      loading={loading}
      onPlaceOrder={handlePlaceOrder}
    />

    {/* Add this: */}
   <div className="mt-6 hidden">
  <PriceSummary formatPrice={(amt) => `₹${Number(amt).toFixed(0)}`} />
</div>

  </div>
</div>


                    {/* Security Badges */}
                    <div className='mt-6 bg-white rounded-[4px] p-4 shadow-sm border border-gray-200'>
                      <div className='text-center'>
                        <h3 className='font-semibold text-black mb-3'>
                          Secure Checkout
                        </h3>
                        <div className='flex justify-center items-center gap-4 text-sm text-gray-600'>
                          <div className='flex items-center gap-2'>
                            <span className='text-[#601E8D]'>🔒</span>
                            <span>SSL Encrypted</span>
                          </div>
                          <div className='flex items-center gap-2'>
                            <span className='text-[#601E8D]'>🛡️</span>
                            <span>Safe & Secure</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
