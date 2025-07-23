import axios from 'axios';

const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;

let token = null;

// 🔐 Get Shiprocket token
export async function getShiprocketToken() {
  if (token) return token;

  try {
    const res = await axios.post(
      'https://apiv2.shiprocket.in/v1/external/auth/login',
      {
        email: SHIPROCKET_EMAIL,
        password: SHIPROCKET_PASSWORD
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    token = res.data.token;
    return token;
  } catch (err) {
    console.error('🚨 Shiprocket login failed:', err.response?.data || err.message);
    throw new Error('Shiprocket login failed.');
  }
}

// 🚚 Create Shiprocket order
export async function createShiprocketOrder(orderData) {
  const authToken = await getShiprocketToken();

  try {
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


export function mapOrderToShiprocket(order) {
  const shipping = order.user_info?.shipping_address || {};
  const gstRate = 18;
  const gstDecimal = gstRate / 100;

  if (
    !shipping.name || !shipping.address || !shipping.city ||
    !shipping.state || !shipping.postal_code || !shipping.phone
  ) {
    throw new Error('Missing required shipping address fields for Shiprocket.');
  }

  const deliveryCharge = Number(order.delivery_charge || 0);
  const totalPaidByUser = Number(order.total || 0);
  const totalProductValue = +(totalPaidByUser - deliveryCharge).toFixed(2);

  // Filter only regular items to calculate per-unit discount
  const regularItems = order.items.filter(item => item.type !== 'kit' && item.type !== 'combo');
  const totalRegularQty = regularItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const discountAmount = order.discount_amount || 0;
  const perUnitDiscount = totalRegularQty > 0
    ? +(discountAmount / totalRegularQty).toFixed(2)
    : 0;

  const orderItems = [];

  for (const item of order.items || []) {
    const quantity = item.quantity || 1;
    const isKitOrCombo = item.type === 'kit' || item.type === 'combo';

    const hsn = item.hsn || item.hsn_code || '34053000';
    const basePrice = Number(item.price || item.original_price || 0);

    let comboIncludes = '';
    if (isKitOrCombo && item.products) {
      comboIncludes = item.products
        .map(p => `• ${p.name} (${p.variant_name || 'Default'}), Qty: ${p.quantity}`)
        .join('\n');
    }

    const sellingPrice = isKitOrCombo
      ? basePrice // Combo/kit: send final price as-is
      : +(basePrice - perUnitDiscount).toFixed(2); // Regular product: deduct per-unit discount

    orderItems.push({
      name: isKitOrCombo
        ? `${item.name}\nIncludes:\n${comboIncludes}`
        : item.name || 'Unnamed',
      sku: item.variant?.variant_code || item.product_code || item.sku || `SKU-${item.id}`,
      units: quantity,
      selling_price: +sellingPrice.toFixed(2),
      discount: 0, // ❌ Always 0 – final price already discounted
      hsn,
      tax: gstRate,
    });
  }

  const subTotal = orderItems.reduce(
    (sum, item) => sum + (item.selling_price * item.units),
    0
  );

  const grandTotal = +(subTotal + deliveryCharge).toFixed(2);

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

    sub_total: +subTotal.toFixed(2),
    total: grandTotal,
    shipping_charges: deliveryCharge,

    length: 10,
    breadth: 15,
    height: 10,
    weight: 1,

    invoice_number: order.order_number,
    invoice_date: new Date(order.created_at).toISOString().split('T')[0],
    comment: `Final: ₹${grandTotal}`
  };
}
