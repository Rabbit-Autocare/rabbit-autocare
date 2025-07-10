// src/lib/shiprocket.js
import axios from 'axios';

const SHIPROCKET_EMAIL = "yogesh.indietribe@gmail.com"; // ✅ Email you used to login to Shiprocket panel
const SHIPROCKET_PASSWORD = "3F*PBk^Si&!QIPym";     // ✅ Password for that email

let token = null;

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
      console.error("🚨 Failed to authenticate with Shiprocket:", error.response?.data || error.message);
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
      if (item.type === 'kit' && Array.isArray(item.kit_products)) {
        return item.kit_products.map((kp) => ({
          name: `${item.name} - ${kp.product?.name || kp.product_name || ''} (${kp.variant?.size || ''}${kp.variant?.unit || ''}${kp.variant?.color ? ', ' + kp.variant.color : ''})`,
          sku: kp.product?.product_code || kp.product_code || 'SKU123',
          hsn: kp.product?.hsn_code || '71179010',
          units: kp.quantity * (item.quantity || 1),
          selling_price: kp.variant?.price || 0,
          original_price: kp.variant?.compare_at_price || kp.variant?.price || 0,
          discount_percent: item.discount_percentage || 0,
        }));
      }
      if (item.type === 'combo' && Array.isArray(item.combo_products)) {
        return item.combo_products.map((cp) => ({
          name: `${item.name} - ${cp.product?.name || cp.product_name || ''} (${cp.variant?.size || ''}${cp.variant?.unit || ''}${cp.variant?.color ? ', ' + cp.variant.color : ''})`,
          sku: cp.product?.product_code || cp.product_code || 'SKU123',
          hsn: cp.product?.hsn_code || '71179010',
          units: cp.quantity * (item.quantity || 1),
          selling_price: cp.variant?.price || 0,
          original_price: cp.variant?.compare_at_price || cp.variant?.price || 0,
          discount_percent: item.discount_percentage || 0,
        }));
      }

      // Regular product
      return [{
        name: item.name,
        sku: item.product?.product_code || item.variant_code || 'SKU123',
        hsn: item.product?.hsn_code || '71179010',
        units: item.quantity,
        selling_price: item.price,
        original_price: item.original_price || item.price,
        discount_percent: item.discount_percentage || 0,
      }];
    });
  }

  const orderItems = getOrderItems(order.items);
  const totalOriginal = orderItems.reduce((sum, i) => sum + (i.original_price || 0) * (i.units || 1), 0);
  const totalFinal = orderItems.reduce((sum, i) => sum + (i.selling_price || 0) * (i.units || 1), 0);
  const totalDiscount = totalOriginal - totalFinal;

  const deliveryCharge = Number(order.delivery_charge) || 0;
  const grandTotal = totalFinal + deliveryCharge;

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

    order_items: orderItems,

    payment_method: 'Prepaid',
    sub_total: totalOriginal,
    discount: totalDiscount,
    total_discount: totalDiscount,
    total: grandTotal,
    shipping_charges: deliveryCharge, // ✅ Explicit delivery charges field

    length: 10,
    breadth: 15,
    height: 10,
    weight: 1,

    comment: order.coupon_code
      ? `Coupon: ${order.coupon_code} | Original: ₹${totalOriginal} | Discount: ₹${totalDiscount} | Delivery: ₹${deliveryCharge} | Final: ₹${grandTotal}`
      : `Original: ₹${totalOriginal} | Discount: ₹${totalDiscount} | Delivery: ₹${deliveryCharge} | Final: ₹${grandTotal}`,
  };
}
