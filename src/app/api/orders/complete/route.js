import { NextResponse } from 'next/server';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { sendOrderConfirmation, sendAdminNotification } from '@/lib/service/emailService';
import { createShiprocketOrder, mapOrderToShiprocket } from '@/lib/shiprocket';
import CouponService from '@/lib/service/couponService';

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

    // ✅ Calculate GST Breakdown
    let totalTaxableValue = 0;
    for (const item of items) {
      const taxable = item.total_price / 1.18;
      totalTaxableValue += taxable;
    }

    totalTaxableValue = Number(totalTaxableValue.toFixed(2));
    const totalGstAmount = Number((total - totalTaxableValue).toFixed(2));
    const cgstAmount = Number((totalGstAmount / 2).toFixed(2));
    const sgstAmount = Number((totalGstAmount / 2).toFixed(2));

    const orderNumber = generateOrderNumber();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
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
        delivery_charge,
        taxable_value: totalTaxableValue,
        gst_amount: totalGstAmount,
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount
      }])
      .select()
      .single();

    if (orderError) {
      console.error('❌ Error creating order:', orderError);
      return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
    }

    // ✅ Clear the user's cart in the background. Fire and forget.
    supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user_id)
      .then(({ error: cartError }) => {
        if (cartError) {
          console.error('❌ Non-blocking cart clearing error:', cartError);
        } else {
          console.log(`✅ Cart cleared for user ${user_id}`);
        }
      });

    // ✅ Remove used coupon from user's auth profile
    if (coupon_id && user_id) {
      try {
        await CouponService.removeUsedCoupon(coupon_id, user_id);
        console.log(`✅ Used coupon ${coupon_id} removed from user ${user_id} and usage count incremented.`);
      } catch (err) {
        console.error('❌ Failed to remove coupon and increment usage count:', err);
      }
    }

    const { data: address, error: addressError } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', shipping_address_id)
      .single();

    if (addressError || !address) {
      console.error('❌ Address Fetch Failed:', addressError);
      return NextResponse.json({ success: false, error: 'Failed to fetch shipping address' }, { status: 500 });
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

    // Don't wait for these to finish. Fire and forget.
    // This ensures the user gets a fast response.
    sendOrderConfirmation(order.user_info?.email, order).catch(emailError => {
      console.error('❌ Non-blocking email sending error (user):', emailError);
    });

    sendAdminNotification(order).catch(emailError => {
      console.error('❌ Non-blocking email sending error (admin):', emailError);
    });

    // Also handle Shiprocket order creation in the background
    (async () => {
      try {
        const shiprocketPayload = mapOrderToShiprocket(order);
        console.log('📦 Background Shiprocket Payload:', shiprocketPayload);
        const shiprocketResult = await createShiprocketOrder(shiprocketPayload);
        console.log('✅ Background Shiprocket Order Created:', shiprocketResult);
        // Save awb_code to the order if available
        if (shiprocketResult?.awb_code) {
          await supabase
            .from('orders')
            .update({ awb_code: shiprocketResult.awb_code })
            .eq('id', order.id);
        }
      } catch (shiprocketError) {
        console.error('❌ Background Shiprocket Order Error:', shiprocketError?.response?.data || shiprocketError.message);
      }
    })();

    // Immediately return success to the user
    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
    });
  } catch (error) {
    console.error('❌ Internal error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
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
      const taxable_value = +(item.total_price / 1.18).toFixed(2);
      const gst_amount = +(item.total_price - taxable_value).toFixed(2);

      if (item.type === 'product') {
        if (item.variant?.id) {
          const { error: stockError } = await supabase.rpc(
            'decrement_stock_by_quantity',
            {
              variant_id: item.variant.id,
              p_quantity: item.quantity,
            }
          );
          if (stockError) {
            console.error(`Stock adjustment failed for variant ${item.variant.id}:`, stockError);
          }
        }

        // ✅ Fix: Extract correct fields from item
        const productCode = item.variant_code || item.product_code || item.variant?.variant_code || '';
        const categoryName = item.category || item.category_name || null;
        const variantDetails = item.variant_display_text || null;

        await supabase.from('sales_records').insert({
          order_id: order.id,
          order_number: orderNumber,
          product_name: item.name,
          product_code: productCode,
          variant_details: variantDetails,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.total_price,
          taxable_value,
          gst_amount,
          sale_type: 'direct',
          category_name: categoryName,
          sale_date: new Date().toISOString().split('T')[0],
        });

      } else if (item.type === 'kit' || item.type === 'combo') {
        const sourceTable = item.type === 'kit' ? 'kit_products' : 'combo_products';
        const sourceIdColumn = item.type === 'kit' ? 'kit_id' : 'combo_id';
        const sourceId = item.type === 'kit' ? item.kit_id : item.combo_id;

        const { data: relatedItems, error: relatedError } = await supabase
          .from(sourceTable)
          .select('variant_id, quantity')
          .eq(sourceIdColumn, sourceId);

        if (relatedError) {
          console.error(`Error fetching related items for ${item.type}:`, relatedError);
          continue;
        }

        for (const related of relatedItems) {
          const { error: stockError } = await supabase.rpc(
            'decrement_stock_by_quantity',
            {
              variant_id: related.variant_id,
              p_quantity: related.quantity * item.quantity,
            }
          );
          if (stockError) {
            console.error(`Stock adjustment failed for variant ${related.variant_id}:`, stockError);
          }
        }

        // ✅ Fix: Extract correct fields for kit/combo
        const productCode = item.variant_code || item.product_code || '';
        const categoryName = item.category || item.category_name || null;

        await supabase.from('sales_records').insert({
          order_id: order.id,
          order_number: orderNumber,
          product_name: item.name,
          product_code: productCode,
          variant_details: `${item.type.toUpperCase()} - ${item.included_products?.length || 0} items`,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.total_price,
          taxable_value,
          gst_amount,
          sale_type: item.type,
          category_name: categoryName,
          sale_date: new Date().toISOString().split('T')[0],
        });
      }
    }
  } catch (error) {
    console.error('Error processing order items:', error);
  }
}
