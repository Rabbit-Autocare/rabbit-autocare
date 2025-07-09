// ✅ FILE: /lib/shiprocket.js (simplified for plain pricing)
import axios from 'axios';

const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;

let token = null;

export async function createShiprocketOrder(orderData) {
  if (!token) {
    try {
      const response = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/auth/login",
        { email: SHIPROCKET_EMAIL, password: SHIPROCKET_PASSWORD },
        { headers: { "Content-Type": "application/json" } }
      );
      token = response.data.token;
    } catch (error) {
      console.error("🚨 Shiprocket login failed:", error.response?.data || error.message);
      throw new Error("Shiprocket login failed.");
    }
  }

  try {
    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
      orderData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("❌ Shiprocket order creation failed:", error.response?.data || error.message);
    throw new Error("Failed to create Shiprocket order.");
  }
}

export function mapOrderToShiprocket(order) {
  const shipping = order.user_info?.shipping_address || {};
  const deliveryCharge = order.delivery_charge || 0;

  const orderItems = (order.items || []).map((item) => {
    const quantity = item.quantity || 1;
    const price = item.price || 0;
    return {
      name: item.name || '',
      sku: item.product_code || 'SKU123',
      units: quantity,
      selling_price: price,
      original_price: price,
      total: +(price * quantity).toFixed(2),
    };
  });

  const sub_total = orderItems.reduce((sum, i) => sum + i.total, 0);
  const total = +(sub_total + deliveryCharge).toFixed(2);

  return {
    order_id: order.order_number,
    order_date: new Date(order.created_at).toISOString().split('T')[0],
    pickup_location: 'warehouse',
    billing_customer_name: shipping.full_name || shipping.name || 'Customer',
    billing_last_name: '',
    billing_address: shipping.street || 'Default Street',
    billing_city: shipping.city || 'City',
    billing_pincode: shipping.postal_code || '000000',
    billing_state: shipping.state || 'State',
    billing_country: 'India',
    billing_email: order.user_info?.email || '',
    billing_phone: shipping.phone || '',
    shipping_is_billing: true,
    payment_method: 'Prepaid',
    shipping_charges: deliveryCharge,
    order_items: orderItems,
    sub_total: +sub_total.toFixed(2),
    total,
    discount: 0,
    total_discount: 0,
    length: 10,
    breadth: 15,
    height: 10,
    weight: 1,
    comment: `Total Products: ₹${sub_total.toFixed(2)} + Delivery: ₹${deliveryCharge.toFixed(2)} = ₹${total.toFixed(2)}`,
  };
}
