import crypto from 'crypto';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req) {
  try {
    // Get the raw request body for signature verification
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    const webhookSignature = req.headers.get('x-razorpay-signature');

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    const isValidSignature = expectedSignature === webhookSignature;

    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Process webhook event
    const { event, payload } = body;
    console.log(`Received Razorpay webhook: ${event}`, payload);

    // Handle different event types
    switch (event) {
      case 'payment.authorized':
        await handlePaymentAuthorized(payload);
        break;
      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;
      case 'payment.captured':
        await handlePaymentCaptured(payload);
        break;
      case 'refund.created':
        await handleRefundCreated(payload);
        break;
      // Add more event handlers as needed
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return Response.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentAuthorized(payload) {
  const { payment } = payload;
  const notes = payment.notes || {};
  const orderId = notes.supabase_order_id;

  if (!orderId) {
    console.error('No order ID found in payment notes');
    return;
  }

  await supabase
    .from('orders')
    .update({
      payment_status: 'authorized',
      status: 'processing',
      payment_id: payment.id,
      razorpay_order_id: payment.order_id,
      payment_data: payment,
      payment_updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);
}

async function handlePaymentCaptured(payload) {
  const { payment } = payload;
  const notes = payment.notes || {};
  const orderId = notes.supabase_order_id;

  if (!orderId) {
    console.error('No order ID found in payment notes');
    return;
  }

  await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'confirmed',
      payment_captured_at: new Date().toISOString(),
      payment_updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);
}

async function handlePaymentFailed(payload) {
  const { payment } = payload;
  const notes = payment.notes || {};
  const orderId = notes.supabase_order_id;

  if (!orderId) {
    console.error('No order ID found in payment notes');
    return;
  }

  await supabase
    .from('orders')
    .update({
      payment_status: 'failed',
      status: 'payment_failed',
      payment_error: JSON.stringify(payment.error),
      payment_updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);
}

async function handleRefundCreated(payload) {
  const { refund } = payload;
  const payment = refund.payment || {};
  const notes = payment.notes || {};
  const orderId = notes.supabase_order_id;

  if (!orderId) {
    console.error('No order ID found in payment notes');
    return;
  }

  await supabase
    .from('orders')
    .update({
      payment_status: 'refunded',
      refund_id: refund.id,
      refund_amount: refund.amount / 100,
      refunded_at: new Date().toISOString(),
      refund_data: refund,
      payment_updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);
}
