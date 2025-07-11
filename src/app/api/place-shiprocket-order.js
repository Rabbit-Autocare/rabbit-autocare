import { createShiprocketOrder, mapOrderToShiprocket } from '@/lib/shiprocket';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { order } = req.body;

    // Basic validation
    if (
      !order ||
      !order.order_number ||
      !order.created_at ||
      !order.items ||
      !Array.isArray(order.items) ||
      order.items.length === 0
    ) {
      return res.status(400).json({ success: false, message: 'Invalid or incomplete order data' });
    }

    // ✅ Map order to Shiprocket payload
    const shiprocketPayload = mapOrderToShiprocket(order);

    // ✅ Create order in Shiprocket
    const shiprocketResponse = await createShiprocketOrder(shiprocketPayload);

    // ✅ Return success response
    return res.status(200).json({
      success: true,
      message: 'Order successfully pushed to Shiprocket',
      shiprocket: shiprocketResponse,
    });
  } catch (error) {
    console.error('❌ Shiprocket API Error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create Shiprocket order',
      error: error.response?.data || error.message,
    });
  }
}
