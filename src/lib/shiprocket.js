import axios from 'axios';

const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;

let token = null;

// 🔐 Get Shiprocket authentication token
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
  const deliveryCharge = Number(order.delivery_charge || 0);
  
  console.log('📊 Processing order:', {
    orderNumber: order.order_number,
    itemsCount: order.items?.length || 0,
    deliveryCharge
  });

  const orderItems = [];

  // 🔄 Process each item in the order (kit, combo, or regular product)
  for (const item of order.items || []) {
    const quantity = item.quantity || 1;
    const isComboOrKit = item.type === 'combo' || item.type === 'kit';
    const hsn = item.hsn || item.hsn_code || '34053000';

    // 📝 For combo/kit items, create detailed description with included products
    let comboIncludes = '';
    if (isComboOrKit && item.products) {
      comboIncludes = (item.products || [])
        .map(p => `• ${p.name} (${p.variant_name || 'Default'}), Qty: ${p.quantity}`)
        .join('\n');
    }

    // 💰 CRITICAL: Use actual item price from order (not calculated per-unit price)
    // This ensures kit/combo/product prices are exactly what customer paid
    const sellingPrice = Number(item.price || 0);

    console.log(`📦 Item: ${item.name} | Type: ${item.type || 'product'} | Price: ₹${sellingPrice} | Qty: ${quantity}`);

    orderItems.push({
      name: isComboOrKit
        ? `${item.name}\nIncludes:\n${comboIncludes}` // Show what's included in kit/combo
        : item.name || 'Unnamed',
      sku: item.variant?.variant_code || item.product_code || item.sku || `SKU-${item.id}`,
      units: quantity,
      selling_price: +sellingPrice.toFixed(2), // Exact price customer paid
      discount: 0, // No item-level discount (already applied in order total)
      hsn,
      tax: gstRate,
    });
  }

  // 🧮 Calculate subtotal from actual item prices (this should match orders.subtotal)
  const subTotal = orderItems.reduce((sum, i) => sum + i.selling_price * i.units, 0);
  const grandTotal = +(subTotal + deliveryCharge).toFixed(2);

  console.log('💰 Order totals:', {
    subTotal: `₹${subTotal}`,
    deliveryCharge: `₹${deliveryCharge}`,
    grandTotal: `₹${grandTotal}`,
    shouldMatchOrdersTotal: `₹${order.total}`
  });

  // ⚠️ Validation: Ensure calculated total matches database total
  if (Math.abs(grandTotal - Number(order.total)) > 0.01) {
    console.warn('⚠️ Total mismatch detected!', {
      calculated: grandTotal,
      database: Number(order.total),
      difference: Math.abs(grandTotal - Number(order.total))
    });
  }

  return {
    order_id: order.order_number,
    order_date: new Date(order.created_at).toISOString().split('T')[0],
    pickup_location: 'warehouse',
    
    // 📋 Billing details (using shipping address as billing)
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
    
    // 📦 Order items and pricing
    order_items: orderItems,
    payment_method: 'Prepaid',
    sub_total: +subTotal.toFixed(2),        // Products total (without delivery)
    total: grandTotal,                       // Final amount (products + delivery)
    shipping_charges: deliveryCharge,        // Delivery charges
    
    // 📏 Default package dimensions (adjust as needed)
    length: 10,
    breadth: 15,
    height: 10,
    weight: 1,
    
    // 📄 Invoice details
    invoice_number: order.order_number,
    invoice_date: new Date(order.created_at).toISOString().split('T')[0],
    comment: `Final: ₹${grandTotal}`,
  };
}
