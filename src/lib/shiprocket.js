// ✅ FILE: /lib/shiprocket.js
import axios from 'axios';

const SHIPROCKET_EMAIL = "yogesh.indietribe@gmail.com";
const SHIPROCKET_PASSWORD = "3F*PBk^Si&!QIPym";

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

  function getOrderItems(items) {
    return items.flatMap((item) => {
      const extractItem = (entry, multiplier = 1) => {
        const variant = entry.variant || {};
        const product = entry.product || entry;

        const gstPercent = Number(variant.gst_percent || 18);
        let basePriceExGST = Number(variant.base_price_excluding_gst || 0);

        if (!basePriceExGST && entry.price) {
          basePriceExGST = +(entry.price / (1 + gstPercent / 100)).toFixed(2);
        }

        const units = entry.quantity * multiplier;
        const taxable = +(basePriceExGST * units).toFixed(2);
        const gstAmount = +(taxable * gstPercent / 100).toFixed(2);
        const cgst = +(gstAmount / 2).toFixed(2);
        const sgst = +(gstAmount / 2).toFixed(2);
        const total = +(taxable + gstAmount).toFixed(2);

        return {
          name: product.name || '',
          sku: product.product_code || entry.product_code || 'SKU123',
          units,
          selling_price: +(basePriceExGST + (basePriceExGST * gstPercent / 100)).toFixed(2),
          original_price: +(variant.compare_at_price || basePriceExGST + (basePriceExGST * gstPercent / 100)).toFixed(2),
          discount_percent: 0,
          hsn: variant.hsn_code || product.hsn_code || 'NA',
          taxable_value: taxable,
          gst_percent: gstPercent,
          cgst,
          sgst,
          gst_amount: gstAmount,
          total,
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
  const totalCgst = orderItems.reduce((sum, i) => sum + i.cgst, 0);
  const totalSgst = orderItems.reduce((sum, i) => sum + i.sgst, 0);
  const totalGst = +(totalCgst + totalSgst).toFixed(2);
  const totalTaxable = orderItems.reduce((sum, i) => sum + i.taxable_value, 0);
  const total = orderItems.reduce((sum, i) => sum + i.total, 0);

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
    shipping_charges: order.delivery_charge || 0,
    order_items: orderItems,
    sub_total: +totalTaxable.toFixed(2),
    gst_total: totalGst,
    cgst_total: +totalCgst.toFixed(2),
    sgst_total: +totalSgst.toFixed(2),
    discount: 0,
    total_discount: 0,
    total: +(total + (order.delivery_charge || 0)).toFixed(2),
    length: 10,
    breadth: 15,
    height: 10,
    weight: calculateTotalWeight(order.items),
    comment: `Taxable: ₹${totalTaxable.toFixed(2)} | CGST: ₹${totalCgst.toFixed(2)} | SGST: ₹${totalSgst.toFixed(2)} | Final: ₹${(total + (order.delivery_charge || 0)).toFixed(2)}`,
  };
}

function calculateTotalWeight(items) {
  let totalWeight = 0;
  for (const item of items) {
    const quantity = item.quantity || 1;
    if (item.type === 'kit') {
      for (const kp of item.kit_products || []) {
        totalWeight += (kp.variant?.weight_grams || 0) * kp.quantity * quantity;
      }
    } else if (item.type === 'combo') {
      for (const cp of item.combo_products || []) {
        totalWeight += (cp.variant?.weight_grams || 0) * cp.quantity * quantity;
      }
    } else {
      totalWeight += (item.variant?.weight_grams || 0) * quantity;
    }
  }
  return Math.max(0.5, +(totalWeight / 1000).toFixed(2)); // in KG
}
