import axios from 'axios';

const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;

let token = null;

// 🔐 Get Shiprocket token
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

// 🧠 Map order to Shiprocket format
export function mapOrderToShiprocket(order) {
  const shipping = order.user_info?.shipping_address || {};
  const gstRate = 18;
  const totalCouponDiscount = order.discount_amount || 0;

  const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const couponPerUnit = totalQty > 0 ? +(totalCouponDiscount / totalQty).toFixed(2) : 0;

  const orderItems = [];

  for (const item of order.items || []) {
    const quantity = item.quantity || 1;

    if (item.type === 'combo' || item.type === 'kit') {
      const basePrice = Number(item.original_price || item.price || 0);
      const finalPrice = Number(item.price || basePrice);
      const unitDiscount = +(basePrice - finalPrice).toFixed(2);
      const hsn = '34053000';

      // 🧾 Combo internal breakdown
      const internal = (item.products || [])
        .map((p) => {
          const variant = p.variant_name || 'Default';
          return `• ${p.name} (${variant}), Qty: ${p.quantity}, SKU: ${p.sku || 'N/A'}`;
        })
        .join('\n');

      const validDiscount = unitDiscount > 0 && unitDiscount < finalPrice ? unitDiscount : 0;

      orderItems.push({
        name: `${item.name}\nIncludes:\n${internal}`,
        sku: item.sku || `KIT-${item.id}`,
        units: quantity,
        selling_price: finalPrice,
        discount: validDiscount,
        hsn,
        tax: gstRate,
      });
    } else {
      // 🧾 Regular product
      const basePrice = item.base_price || item.price || 0;
      const finalPrice = item.price || basePrice;
      const baseDiscount = basePrice - finalPrice;
      // Calculate total discount for this item (base + coupon)
      const totalDiscountForItem = (baseDiscount * quantity) + (couponPerUnit * quantity);
      // Calculate per-unit discount
      const finalUnitDiscount = quantity > 0 ? +(totalDiscountForItem / quantity).toFixed(2) : 0;
      const hsn = item.hsn_code || '34053000';

      orderItems.push({
        name: item.name || 'Unnamed',
        sku: item.variant_code || item.product_code || 'SKU123',
        units: quantity,
        selling_price: finalPrice,
        discount: finalUnitDiscount > 0 ? finalUnitDiscount : 0,
        hsn,
        tax: gstRate,
      });
    }
  }

  const deliveryCharge = Number(order.delivery_charge || 0);
  const subTotal = orderItems.reduce((sum, i) => sum + ((i.selling_price - i.discount) * i.units), 0);
  const totalDiscount = orderItems.reduce((sum, i) => sum + (i.discount * i.units), 0);
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
