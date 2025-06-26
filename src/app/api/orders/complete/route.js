import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { sendOrderConfirmation, sendAdminNotification } from '@/lib/service/emailService';
import { createShiprocketOrder, mapOrderToShiprocket } from '@/lib/shiprocket';

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      user_id,
      user_info,
      shipping_address_id,
      billing_address_id,
      items,
      subtotal,
      total,
      coupon_id,
      discount_amount,
      payment_status,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (!user_id || !shipping_address_id || !billing_address_id || !items || !total) {
      return NextResponse.json(
        { success: false, error: 'Missing required order details' },
        { status: 400 }
      );
    }

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create order in DB
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id,
          user_info,
          shipping_address_id,
          billing_address_id,
          items,
          subtotal,
          total,
          coupon_id: coupon_id || null,
          discount_amount: discount_amount || 0,
          payment_status: payment_status || 'paid',
          status: 'confirmed',
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          order_number: orderNumber,
          completed_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { success: false, error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Process inventory and send emails
    await processOrderItems(order);

    // Send emails
    try {
      await sendOrderConfirmation(order.user_info?.email, order);
      await sendAdminNotification(order);
    } catch (emailError) {
      console.error('Error sending emails:', emailError);
    }

    // --- SHIPROCKET INTEGRATION START ---
    try {
      const shiprocketPayload = mapOrderToShiprocket(order);
      console.log('Shiprocket payload:', shiprocketPayload);
      const shiprocketResult = await createShiprocketOrder(shiprocketPayload);
      console.log('Shiprocket order created:', shiprocketResult);
    } catch (shiprocketError) {
      console.error('Shiprocket order error:', shiprocketError?.response?.data || shiprocketError.message || shiprocketError);
      // Optionally: log this in your DB for admin review
    }
    // --- SHIPROCKET INTEGRATION END ---

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
    });
  } catch (error) {
    console.error('Error completing order:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateOrderNumber() {
  // Example: YYYYMMDD-random4digits
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${date}-${rand}`;
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
