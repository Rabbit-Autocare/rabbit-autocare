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

// 🔁 Convert internal order → Shiprocket format
export function mapOrderToShiprocket(order) {
  const shipping = order.user_info?.shipping_address || {};
  const gstRate = 18;

  const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const discountAmount = order.discount_amount || 0;
  const discountMeta = order.applied_coupon || {};

  const orderItems = [];

  for (const item of order.items || []) {
    const quantity = item.quantity || 1;
    const isComboOrKit = item.type === 'combo' || item.type === 'kit';

    const mrpInclGst = Number(item.original_price || item.base_price || item.compare_at_price || item.price || 0);

    // 👇 Send MRP directly as "selling_price"
    const unitDiscountInclGst = totalQty > 0 && discountAmount > 0
      ? +(discountAmount / totalQty).toFixed(2)
      : 0;

    const hsn = item.hsn || item.hsn_code || '34053000';

    let comboIncludes = '';
    if (isComboOrKit && item.products) {
      comboIncludes = (item.products || [])
        .map(p => `• ${p.name} (${p.variant_name || 'Default'}), Qty: ${p.quantity}`)
        .join('\n');
    }

    orderItems.push({
      name: isComboOrKit ? `${item.name}\nIncludes:\n${comboIncludes}` : item.name || 'Unnamed',
      sku: item.variant_code || item.product_code || item.sku || `SKU-${item.id}`,
      units: quantity,
      selling_price: +mrpInclGst.toFixed(2),   // ✅ Send MRP
      discount: +unitDiscountInclGst.toFixed(2), // ✅ Per unit discount
      hsn,
      tax: gstRate                              // ✅ Let Shiprocket add tax
    });
  }

  const deliveryCharge = Number(order.delivery_charge || 0);

  const subTotal = orderItems.reduce(
    (sum, i) => sum + ((i.selling_price - i.discount) * i.units),
    0
  );

  const totalDiscount = orderItems.reduce(
    (sum, i) => sum + (i.discount * i.units),
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
////-------------