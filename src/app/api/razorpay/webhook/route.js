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

  try {
    console.log('Processing payment captured for order:', orderId);

    // First, get the order details to process inventory
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('Error fetching order for completion:', orderError);
      return;
    }

    // Process inventory and create sales records
    await processOrderItems(order);

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        payment_captured_at: new Date().toISOString(),
        payment_updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return;
    }

    console.log('Order completed successfully via webhook:', orderId);
  } catch (error) {
    console.error('Error processing payment captured:', error);
  }
}

// Helper function to process order items (stock deduction and sales records)
async function processOrderItems(order) {
  try {
    const items = order.items || [];
    const orderNumber = order.order_number;

    for (const item of items) {
      if (item.type === 'product') {
        // Handle single product
        if (item.variant?.id) {
          // Deduct stock for the variant
          const { error: stockError } = await supabase.rpc(
            'adjust_variant_stock',
            {
              variant_id_input: item.variant.id,
              quantity_input: item.quantity,
              operation: 'subtract',
            }
          );

          if (stockError) {
            console.error(
              `Stock adjustment failed for variant ${item.variant.id}:`,
              stockError
            );
            // Continue processing other items even if one fails
          }
        }

        // Create sales record
        await supabase.from('sales_records').insert({
          order_id: order.id,
          order_number: orderNumber,
          product_name: item.name,
          product_code: item.product_code || '',
          variant_details: item.variant_display_text || null,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.total_price,
          sale_type: 'direct',
          category_name: item.category_name || null,
          sale_date: new Date().toISOString().split('T')[0],
        });
      } else if (item.type === 'kit' || item.type === 'combo') {
        // Process kits and combos
        const sourceTable = item.type === 'kit' ? 'kit_products' : 'combo_products';
        const sourceIdColumn = item.type === 'kit' ? 'kit_id' : 'combo_id';
        const sourceId = item.type === 'kit' ? item.kit_id : item.combo_id;

        // Get related products for this kit/combo
        const { data: relatedItems, error: relatedError } = await supabase
          .from(sourceTable)
          .select('variant_id, quantity')
          .eq(sourceIdColumn, sourceId);

        if (relatedError) {
          console.error(`Error fetching related items for ${item.type}:`, relatedError);
          continue;
        }

        // Deduct stock for each related product
        for (const related of relatedItems) {
          const { error: stockError } = await supabase.rpc(
            'adjust_variant_stock',
            {
              variant_id_input: related.variant_id,
              quantity_input: related.quantity * item.quantity,
              operation: 'subtract',
            }
          );

          if (stockError) {
            console.error(
              `Stock adjustment failed for variant ${related.variant_id}:`,
              stockError
            );
          }
        }

        // Create sales record for kit/combo
        await supabase.from('sales_records').insert({
          order_id: order.id,
          order_number: orderNumber,
          product_name: item.name,
          product_code: item.product_code || '',
          variant_details: `${item.type.toUpperCase()} - ${item.included_products?.length || 0} items`,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.total_price,
          sale_type: item.type,
          category_name: item.category_name || null,
          sale_date: new Date().toISOString().split('T')[0],
        });
      }
    }
  } catch (error) {
    console.error('Error processing order items:', error);
  }
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
