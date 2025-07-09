import { createShiprocketOrder } from '@/lib/shiprocket';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { user, products, orderId, delivery_charge = 0 } = req.body;

  const orderItems = products.map((p) => {
    const gstPercent = p.gst || p.tax || 18;
    const hsn = p.hsn || 'NA';
    const price = Number(p.price);
    const qty = Number(p.quantity);
    const taxable = +(price / (1 + gstPercent / 100)).toFixed(2);
    const gstAmount = +(price - taxable).toFixed(2);
    const cgst = +(gstAmount / 2).toFixed(2);
    const sgst = +(gstAmount / 2).toFixed(2);
    const total = +(price * qty).toFixed(2);

    return {
      name: p.name,
      sku: p.sku || 'SKU123',
      units: qty,
      selling_price: price,
      original_price: price,
      hsn,
      taxable_value: +(taxable * qty).toFixed(2),
      gst_percent: gstPercent,
      gst_amount: +(gstAmount * qty).toFixed(2),
      cgst: +(cgst * qty).toFixed(2),
      sgst: +(sgst * qty).toFixed(2),
      total,
    };
  });

  const sub_total = orderItems.reduce((sum, i) => sum + i.taxable_value, 0);
  const gst_total = orderItems.reduce((sum, i) => sum + i.gst_amount, 0);
  const total = sub_total + gst_total + delivery_charge;

  const payload = {
    order_id: orderId,
    order_date: new Date().toISOString().split('T')[0],
    pickup_location: 'Primary',
    billing_customer_name: user.name,
    billing_last_name: '',
    billing_address: user.address,
    billing_city: user.city,
    billing_pincode: user.pincode,
    billing_state: user.state,
    billing_country: 'India',
    billing_email: user.email,
    billing_phone: user.phone,
    shipping_is_billing: true,
    payment_method: 'Prepaid',
    shipping_charges: delivery_charge,
    order_items: orderItems,
    sub_total: +sub_total.toFixed(2),
    gst_total: +gst_total.toFixed(2),
    cgst_total: +(gst_total / 2).toFixed(2),
    sgst_total: +(gst_total / 2).toFixed(2),
    discount: 0,
    total_discount: 0,
    total: +total.toFixed(2),
    length: 10,
    breadth: 15,
    height: 10,
    weight: 1,
    comment: `Taxable: ₹${sub_total.toFixed(2)} | CGST+SGST: ₹${gst_total.toFixed(
      2
    )} | Final: ₹${total.toFixed(2)}`,
  };

  try {
    const result = await createShiprocketOrder(payload);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('Shiprocket Error:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
}
