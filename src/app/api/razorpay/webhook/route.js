import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function POST(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    // Verify webhook signature
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    // Handle payment success
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;

      // Update order status
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          razorpay_payment_id: payment.id,
          updated_at: new Date().toISOString()
        })
        .eq('razorpay_order_id', payment.order_id);

      if (error) {
        console.error('Error updating order:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
