// pages/api/orders/complete.js

import { createSupabaseServerClient } from '@/lib/supabase';
import placeOrderInShiprocket from '@/lib/shiprocket/placeOrder';

export default async function handler(req, res) {
  const { order_number } = req.body;

  const supabase = await createSupabaseServerClient();

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', order_number)
    .single();

  if (!order) return res.status(404).json({ error: 'Order not found' });

  const response = await placeOrderInShiprocket(order); // push to Shiprocket

  if (response.success) {
    await supabase
      .from('orders')
      .update({ shiprocket_awb: response.data.awb_code })
      .eq('order_number', order_number);
  }

  return res.status(200).json({ success: true });
}
