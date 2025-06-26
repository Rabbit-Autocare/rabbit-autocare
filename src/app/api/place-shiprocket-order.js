import { createShiprocketOrder } from '@/lib/shiprocket';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { user, products, orderId } = req.body;

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
    order_items: products.map((p) => ({
      name: p.name,
      sku: p.sku || 'SKU123',
      units: p.quantity,
      selling_price: p.price,
    })),
    payment_method: 'Prepaid',
    sub_total: products.reduce((sum, p) => sum + p.price * p.quantity, 0),
    length: 10,
    breadth: 15,
    height: 10,
    weight: 1,
  };

  try {
    const result = await createShiprocketOrder(payload);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('Shiprocket Error:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
}
