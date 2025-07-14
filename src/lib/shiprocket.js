import axios from 'axios';

const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;

let token = null;

// 🔐 Get Shiprocket auth token (reused if already fetched)
async function getShiprocketToken() {
  if (token) return token;

  try {
    const res = await axios.post(
      'https://apiv2.shiprocket.in/v1/external/auth/login',
      { email: SHIPROCKET_EMAIL, password: SHIPROCKET_PASSWORD },
      { headers: { 'Content-Type': 'application/json' } }
    );
    token = res.data.token;
    return token;
  } catch (err) {
    console.error('🚨 Shiprocket login failed:', err.response?.data || err.message);
    throw new Error('Shiprocket login failed.');
  }
}

// 🚚 Create Shiprocket order with full calculated invoice fields
export async function createShiprocketOrder(orderData) {
  try {
    const authToken = await getShiprocketToken();
    const response = await axios.post(
      'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
      orderData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Shiprocket order creation failed:', error.response?.data || error.message);
    throw new Error('Failed to create Shiprocket order.');
  }
}

// 🧠 Map order from your DB to Shiprocket format
export function mapOrderToShiprocket(order) {
  const shipping = order.user_info?.shipping_address || {};
  const gstRate = 18;
  const totalCouponDiscount = order.discount_amount || 0;

  // Step 1: Calculate total units (for per-unit coupon discount split)
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const couponPerUnit = totalQuantity > 0 ? +(totalCouponDiscount / totalQuantity).toFixed(2) : 0;

  // Step 2: Build Shiprocket order_items array
  const orderItems = (order.items || []).map((item) => {
    const quantity = item.quantity || 1;

    if (item.type === 'combo' || item.type === 'kit') {
  const quantity = item.quantity || 1;
  const basePrice = Number(item.original_price || item.price || 0);
  const finalPrice = Number(item.price || basePrice);
  const unitDiscount = +(basePrice - finalPrice).toFixed(2);
  const hsn = '34053000';

  // ✅ Build full breakdown of internal products
  const internalDetails = (item.products || []).map((p) => {
    const name = p.name || 'Unnamed';
    const size = p.size || p.variant_name || 'Default';
    const sku = p.sku || 'N/A';
    const hsnCode = p.hsn_code || '34053000';
    const qty = p.quantity || 1;
    return `• ${name} (${size}) | SKU: ${sku}, HSN: ${hsnCode}, Qty: ${qty}`;
  }).join('\n');

  // ✅ Prevent discount from exceeding price (which breaks GST)
  const validDiscount = unitDiscount > 0 && unitDiscount < finalPrice ? unitDiscount : 0;

  return {
    name: `${item.name}\nIncludes:\n${internalDetails}`,
    sku: item.sku || `COMBO-${item.id}`,
    units: quantity,
    selling_price: finalPrice,
    discount: validDiscount,
    hsn,
    tax: 18
  };
}


    // ✅ Handle Regular Product
    const basePrice = item.base_price || item.price || 0;
    const finalPrice = item.price || basePrice;
    const baseDiscount = basePrice - finalPrice;
    const finalUnitDiscount = +(baseDiscount + couponPerUnit).toFixed(2);
    const hsn = item.hsn_code || '34053000';

    return {
      name: item.name || 'Unknown Product',
      sku: item.variant_code || item.product_code || 'SKU123',
      units: quantity,
      selling_price: finalPrice,
      discount: finalUnitDiscount > 0 ? finalUnitDiscount : 0,
      hsn,
      tax: gstRate
    };
  });

  // Step 3: Calculate sub_total (after discount), total_discount, grandTotal
  const deliveryCharge = Number(order.delivery_charge || 0);

  const subTotal = orderItems.reduce(
    (sum, item) => sum + ((item.selling_price - item.discount) * item.units),
    0
  );

  const totalDiscount = orderItems.reduce(
    (sum, item) => sum + (item.discount * item.units),
    0
  );

  const grandTotal = +(subTotal + deliveryCharge).toFixed(2);

  // ✅ Final return object
  return {
    order_id: order.order_number,
    order_date: new Date(order.created_at).toISOString().split('T')[0],
    pickup_location: 'warehouse',

    billing_customer_name: shipping.name || '',
    billing_last_name: '',
    billing_address: shipping.address || '',
    billing_city: shipping.city || '',
    billing_pincode: shipping.postal_code || '',
    billing_state: shipping.state || '',
    billing_country: 'India',
    billing_email: order.user_info?.email || '',
    billing_phone: shipping.phone || '',
    shipping_is_billing: true,

    order_items: orderItems,
    payment_method: 'Prepaid',

    // ✅ Required for invoice calculations
    sub_total: +subTotal.toFixed(2),
    total_discount: +totalDiscount.toFixed(2),
    total: grandTotal,

    shipping_charges: deliveryCharge,

    length: 10,
    breadth: 15,
    height: 10,
    weight: 1,

    invoice_number: order.order_number,
    invoice_date: new Date(order.created_at).toISOString().split('T')[0],

    comment: `Final: ₹${grandTotal} | Discount: ₹${totalDiscount}`
  };
}
