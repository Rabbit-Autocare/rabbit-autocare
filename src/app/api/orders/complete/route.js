import { NextResponse } from 'next/server';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { sendOrderConfirmation, sendAdminNotification } from '@/lib/service/emailService';
import { createShiprocketOrder, mapOrderToShiprocket } from '@/lib/shiprocket';

const supabase = createSupabaseBrowserClient();

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
      delivery_charge
    } = body;

    if (!user_id || !shipping_address_id || !billing_address_id || !items || !total) {
      return NextResponse.json(
        { success: false, error: 'Missing required order details' },
        { status: 400 }
      );
    }

    const orderNumber = generateOrderNumber();

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
          delivery_charge: delivery_charge},
      ])
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
    }

    const { data: address, error: addressError } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', shipping_address_id)
      .single();

    if (addressError || !address) {
      console.error('❌ Address Fetch Failed:', addressError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch shipping address' },
        { status: 500 }
      );
    }

    order.user_info = order.user_info || {};
    order.user_info.shipping_address = {
      name: address.full_name,
      phone: address.phone,
      address: address.street,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
    };

    await processOrderItems(order);

    try {
      await sendOrderConfirmation(order.user_info?.email, order);
      await sendAdminNotification(order);
    } catch (emailError) {
      console.error('Error sending emails:', emailError);
    }

    try {
      const shiprocketPayload = mapOrderToShiprocket(order);
      console.log('Shiprocket payload:', shiprocketPayload);
      const shiprocketResult = await createShiprocketOrder(shiprocketPayload);
      console.log('Shiprocket order created:', shiprocketResult);
    } catch (shiprocketError) {
      console.error('Shiprocket order error:', shiprocketError?.response?.data || shiprocketError.message);
    }

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
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${date}-${rand}`;
}

async function processOrderItems(order) {
  try {
    const items = order.items || [];
    const orderNumber = order.order_number;

    for (const item of items) {
      if (item.type === 'product' && item.variant?.id) {
        await supabase.rpc('adjust_variant_stock', {
          variant_id_input: item.variant.id,
          quantity_input: item.quantity,
          operation: 'subtract',
        });
      }

      await supabase.from('sales_records').insert({
        order_id: order.id,
        order_number: orderNumber,
        product_name: item.name,
        product_code: item.product_code || '',
        variant_details: item.variant_display_text || null,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.total_price,
        sale_type: item.type || 'direct',
        category_name: item.category_name || null,
        sale_date: new Date().toISOString().split('T')[0],
      });
    }
  } catch (error) {
    console.error('Error processing order items:', error);
  }
}