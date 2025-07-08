import axios from 'axios';

const SHIPROCKET_EMAIL = "yogesh.indietribe@gmail.com"; // ✅ Your Shiprocket login email
const SHIPROCKET_PASSWORD = "3F*PBk^Si&!QIPym";          // ✅ Your Shiprocket password

let token = null;

// Authenticate and create order
export async function createShiprocketOrder(orderData) {
  if (!token) {
    try {
      const response = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/auth/login",
        {
          email: SHIPROCKET_EMAIL,
          password: SHIPROCKET_PASSWORD,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
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

// Map your Supabase order object to Shiprocket's format
export function mapOrderToShiprocket(order) {
  const shipping = order.user_info?.shipping_address || {};

  function getOrderItems(items) {
    return items.flatMap((item) => {
      const extractItem = (entry, multiplier = 1) => {
        const price = Number(entry.variant?.price || entry.price || 0);
        const gstPercent = Number(entry.variant?.gst_percent || 18);
        const hsnCode = entry.variant?.hsn_code || entry.product?.hsn_code || 'NA';

        const basePriceExclGst = price / (1 + gstPercent / 100);
        const gstAmount = price - basePriceExclGst;

        return {
          name: entry.product?.name || entry.name || '',
          sku: entry.product?.product_code || entry.product_code || 'SKU123',
          units: entry.quantity * multiplier,
          selling_price: price,
          original_price: entry.variant?.compare_at_price || price,
          discount_percent: item.discount_percentage || 0,
          hsn: item.hsn || '33073000', 
          taxable_value: Number(basePriceExclGst.toFixed(2)),
          gst_percent: gstPercent,
          gst_amount: Number(gstAmount.toFixed(2)),
          total: Number(price.toFixed(2)),
        };
      };

      if (item.type === 'kit') {
        return item.kit_products.map((kp) => extractItem(kp, item.quantity));
      } else if (item.type === 'combo') {
        return item.combo_products.map((cp) => extractItem(cp, item.quantity));
      } else {
        return [extractItem(item)];
      }
    });
  }

  const orderItems = getOrderItems(order.items || []);
  const subTotal = orderItems.reduce((sum, i) => sum + (i.original_price || 0) * i.units, 0);
  const total = orderItems.reduce((sum, i) => sum + (i.total || 0) * i.units, 0);
  const totalGst = orderItems.reduce((sum, i) => sum + (i.gst_amount || 0) * i.units, 0);
  const totalTaxable = orderItems.reduce((sum, i) => sum + (i.taxable_value || 0) * i.units, 0);
  const totalDiscount = subTotal - total;

  return {
    order_id: order.order_number,
    order_date: new Date(order.created_at).toISOString().split('T')[0],
    pickup_location: 'warehouse',
    billing_customer_name: shipping.name || shipping.full_name || '',
    billing_last_name: '',
    billing_address: shipping.street || shipping.address || '',
    billing_city: shipping.city || '',
    billing_pincode: shipping.pincode || shipping.postal_code || '',
    billing_state: shipping.state || '',
    billing_country: 'India',
    billing_email: order.user_info?.email || '',
    billing_phone: shipping.phone || '',
    shipping_is_billing: true,
    payment_method: 'Prepaid',
    order_items: orderItems,
    sub_total: Number(totalTaxable.toFixed(2)),
    gst_total: Number(totalGst.toFixed(2)),
    discount: Number(totalDiscount.toFixed(2)),
    total_discount: Number(totalDiscount.toFixed(2)),
    total: Number(total.toFixed(2)),
    length: 10,
    breadth: 15,
    height: 10,
    weight: calculateTotalWeight(order.items),
    comment: order.coupon_code
      ? `Coupon: ${order.coupon_code} | Taxable: ₹${totalTaxable} | GST: ₹${totalGst} | Final: ₹${total}`
      : `Taxable: ₹${totalTaxable} | GST: ₹${totalGst} | Final: ₹${total}`,
  };
}

function calculateTotalWeight(items) {
  let totalWeight = 0;
  for (const item of items) {
    if (item.type === 'kit') {
      for (const kp of item.kit_products || []) {
        totalWeight += (kp.variant?.weight_grams || 0) * kp.quantity * item.quantity;
      }
    } else if (item.type === 'combo') {
      for (const cp of item.combo_products || []) {
        totalWeight += (cp.variant?.weight_grams || 0) * cp.quantity * item.quantity;
      }
    } else {
      totalWeight += (item.variant?.weight_grams || 0) * item.quantity;
    }
  }
  return Math.max(1, +(totalWeight / 1000).toFixed(2)); // in kg, minimum 1kg
}
