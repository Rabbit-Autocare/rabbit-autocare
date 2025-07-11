import axios from 'axios';

const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL; // 🔒 Use environment variables!
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;

let token = null;

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

export function mapOrderToShiprocket(order) {
  const shipping = order.user_info?.shipping_address || {};

  const orderItems = (order.items || []).flatMap((item) => {
    const baseName = item.name || 'Unknown Item';
    const quantity = item.quantity || 1;

    if (item.type === 'kit' && Array.isArray(item.kit_products)) {
      return item.kit_products.map((kp) => ({
        name: `${baseName} - ${kp.product?.name || kp.product_name || ''}`,
        sku: kp.product?.product_code || kp.product_code || 'SKU123',
        units: kp.quantity * quantity,
        selling_price: kp.variant?.price || 0,
      }));
    }

    if (item.type === 'combo' && Array.isArray(item.combo_products)) {
      return item.combo_products.map((cp) => ({
        name: `${baseName} - ${cp.product?.name || cp.product_name || ''}`,
        sku: cp.product?.product_code || cp.product_code || 'SKU123',
        units: cp.quantity * quantity,
        selling_price: cp.variant?.price || 0,
      }));
    }

    // Default single product case
    return [{
      name: baseName,
      sku: item.variant_code || item.product?.product_code || 'SKU123',
      units: quantity,
      selling_price: item.price,
    }];
  });

  const deliveryCharge = Number(order.delivery_charge || 0);
  const grandSubtotal = orderItems.reduce((sum, i) => sum + i.selling_price * i.units, 0);
  const grandTotal = grandSubtotal + deliveryCharge;

  return {
    order_id: order.order_number,
    order_date: new Date(order.created_at).toISOString().split('T')[0],
    pickup_location: 'warehouse',

    billing_customer_name: shipping.name || '',
    billing_last_name: '',
    billing_address: shipping.address || '',
    billing_city: shipping.city || '',
    billing_pincode: shipping.postal_code || shipping.pincode || '',
    billing_state: shipping.state || '',
    billing_country: 'India',
    billing_email: order.user_info?.email || '',
    billing_phone: shipping.phone || '',
    shipping_is_billing: true,

    order_items: orderItems,
    payment_method: 'Prepaid',
    sub_total: grandSubtotal,
    total: grandTotal,
    shipping_charges: deliveryCharge,
    length: 10,
    breadth: 15,
    height: 10,
    weight: 1,

    comment: `Includes delivery charge of ₹${deliveryCharge}`,
  };
}
