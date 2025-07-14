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
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const discountPerUnit = totalQuantity > 0 ? +(totalCouponDiscount / totalQuantity).toFixed(2) : 0;

  const orderItems = (order.items || []).map((item) => {
    const baseName = item.name || 'Unknown Item';
    const quantity = item.quantity || 1;
    const unitPrice = item.price || 0;
    const hsn = item.hsn_code || '34053000';

    const baseUnitDiscount =
      item.base_price && item.base_price > unitPrice
        ? item.base_price - unitPrice
        : 0;

    const finalUnitDiscount = +(baseUnitDiscount + discountPerUnit).toFixed(2);

    return {
      name: baseName,
      sku: item.variant_code || item.product_code || 'SKU123',
      units: quantity,
      selling_price: unitPrice,     // MRP (including GST)
      discount: finalUnitDiscount,  // Combined unit-level + coupon discount
      hsn: hsn,
      tax: gstRate
    };
  });

  const deliveryCharge = Number(order.delivery_charge || 0);

  // ✅ NEW: Actual total after discount
  const totalAfterDiscount = orderItems.reduce(
    (sum, i) => sum + (i.selling_price - i.discount) * i.units,
    0
  );

  // const grandTotal = totalAfterDiscount + deliveryCharge;

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

    // ✅ These 2 now reflect actual payable value after discount
    sub_total: totalAfterDiscount,
    // total: grandTotal,

    shipping_charges: deliveryCharge,
    length: 10,
    breadth: 15,
    height: 10,
    weight: 1,

    invoice_number: order.order_number,
    invoice_date: new Date(order.created_at).toISOString().split('T')[0],

    // comment: `Auto-generated order for ${shipping.name}. Final amount: ₹${grandTotal.toFixed(2)}`,
  };
}
